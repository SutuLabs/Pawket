import { PrivateKey, G1Element, G2Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes, bigint_from_bytes, bigint_to_bytes } from "clvm";
import { OriginCoin, SpendBundle } from "@/models/wallet";
import store from "@/store";
import { GetParentPuzzleResponse } from "@/models/api";
import { DEFAULT_HIDDEN_PUZZLE_HASH, GROUP_ORDER } from "../coin/consts";
import { prefix0x } from "../coin/condition";
import puzzle, { PuzzleDetail } from "../crypto/puzzle";

interface PuzzleSolutionResult {
  solution: string;
  result: string;
}
export type GetPuzzleApiCallback = (parentCoinId: string) => Promise<GetParentPuzzleResponse | undefined>;

class Transfer {
  public async generateSpendBundleInternal(
    coins: OriginCoin[],
    puzzles: PuzzleDetail[],
    getPuzzlesSolutionResult: (coin: OriginCoin, puzzle_reveal: string) => Promise<PuzzleSolutionResult>,
    signSolution: (BLS: ModuleInstance, solution_executed_result: string, synthetic_sk: PrivateKey, coinname: Bytes) => Promise<G2Element>,
    amount: bigint,
    fee: bigint): Promise<SpendBundle | null> {
    if (!store.state.app.bls) return null;
    const BLS = store.state.app.bls;
    if (coins.length < 1) return null;
    const coin = this.findPossibleSmallest(coins, amount + fee);
    if (!coin) return null;
    if (amount + fee > coin.amount) return null;
    // console.log("prepare to use coin", coin)

    const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign({}, ...puzzles.map((x) => ({ [prefix0x(x.hash)]: x })));
    const puz = puzzleDict[coin.puzzle_hash];
    if (!puz) return null;
    const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
    const sk = puz.privateKey;

    const synthetic_sk = this.calculate_synthetic_secret_key(BLS, sk, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
    const psr = await getPuzzlesSolutionResult(coin, puzzle_reveal);
    const coinname = this.getCoinName(coin);
    const signature = await signSolution(BLS, psr.result, synthetic_sk, coinname);
    const sig = Bytes.from(signature.serialize()).hex();
    const solution = prefix0x(await puzzle.encodePuzzle(psr.solution));

    return {
      aggregated_signature: prefix0x(sig),
      coin_spends: [{ coin, puzzle_reveal, solution }]
    }
  }

  private findPossibleSmallest(coins: OriginCoin[], num: bigint): OriginCoin | null {
    const sortcoins = coins.sort((a, b) => Number(a.amount - b.amount));
    for (let i = 0; i < sortcoins.length; i++) {
      const coin = sortcoins[i];
      if (coin.amount >= num) return coin;
    }

    return null;
  }

  public getDelegatedPuzzle(conditions: (string | string[])[][]): string {
    return "(q " + conditions
      .map(_ => "(" + _
        .map(_ => (typeof _ === "object" ? ("(" + _.join(" ") + ")") : _))
        .join(" ") + ")")
      .join(" ") + ")";
  }

  public getCoinName(coin: OriginCoin): Bytes {
    const a = bigint_to_bytes(BigInt(coin.amount), { signed: true });
    const pci = Bytes.from(coin.parent_coin_info, "hex");
    const ph = Bytes.from(coin.puzzle_hash, "hex");
    const cont = pci.concat(ph).concat(a);
    const coinname = Bytes.SHA256(cont);
    return coinname;
  }

  private calculate_synthetic_offset(public_key: G1Element, hidden_puzzle_hash: Uint8Array): bigint {
    const blob = Bytes.SHA256(new Uint8Array([...public_key.serialize(), ...hidden_puzzle_hash]));
    let offset = bigint_from_bytes(blob, { signed: true })
    while (offset < 0) offset += GROUP_ORDER;
    offset %= GROUP_ORDER;
    return offset;
  }

  private calculate_synthetic_secret_key(BLS: ModuleInstance, secret_key: PrivateKey, hidden_puzzle_hash: Uint8Array): PrivateKey {
    const secret_exponent = bigint_from_bytes(Bytes.from(secret_key.serialize()), { signed: true });
    const public_key = secret_key.get_g1();
    const synthetic_offset = this.calculate_synthetic_offset(public_key, hidden_puzzle_hash);
    const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % GROUP_ORDER
    const blob = bigint_to_bytes(synthetic_secret_exponent).raw();
    const synthetic_secret_key = BLS.PrivateKey.from_bytes(blob, true)
    return synthetic_secret_key;
  }
}

export default new Transfer();
