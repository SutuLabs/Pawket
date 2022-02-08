import { PrivateKey, G1Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes, bigint_from_bytes, bigint_to_bytes } from "clvm";
import { OriginCoin, PuzzleInfo, SpendBundle } from "@/models/wallet";
import store from "@/store";
import puzzle from "./puzzle";

class CoinConditions {
  public static CREATE_COIN(puzzlehash: string, amount: bigint): string[] {
    return ["51", this.prefix0x(puzzlehash), this.prefix0x(Bytes.from(bigint_to_bytes(amount, { signed: true })).hex())];
  }
  public static CREATE_COIN_ANNOUNCEMENT(message: string): string[] {
    return ["60", message];
  }
  public static ASSERT_COIN_ANNOUNCEMENT(announcementId: string): string[] {
    return ["61", announcementId];
  }

  public static prefix0x(str: string): string {
    return str.startsWith("0x") ? str : "0x" + str;
  }
}

class Transfer {
  static readonly GROUP_ORDER = BigInt(bigint_from_bytes(Bytes.from("0x73EDA753299D7D483339D80809A1D80553BDA402FFFE5BFEFFFFFFFF00000001", "hex")));
  static readonly DEFAULT_HIDDEN_PUZZLE_HASH = Bytes.from("711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699", "hex");
  static readonly AGG_SIG_ME_ADDITIONAL_DATA = Bytes.from("ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb", "hex");

  public async generateSpendBundle(
    coins: OriginCoin[],
    sk_hex: string,
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): Promise<SpendBundle | null> {
    //   const sig = await this.generateSignature(coins, sk_hex,)
    // }

    // public async generateSignature(coins: CoinItem[], sk_hex: string, tgt_address: string, amount: number, fee: number, change_address: string) {
    if (!store.state.app.bls) return null;
    const BLS = store.state.app.bls;
    if (coins.length < 1) return null;
    const coin = this.findPossibleSmallest(coins, amount + fee);
    if (!coin) return null;
    if (amount + fee > coin.amount) return null;

    const gen_sk = BLS.PrivateKey.from_bytes(Bytes.from(sk_hex, "hex").raw(), true);
    const puzzles = await puzzle.getPuzzles(gen_sk.serialize(), 0, 10);
    const puzzleDict: { [key: string]: PuzzleInfo } = Object.assign({}, ...puzzles.map((x) => ({ [CoinConditions.prefix0x(x.puzzleHash)]: x })));
    const puz = puzzleDict[coin.puzzle_hash];
    if (!puz) return null;
    const puzzle_reveal = CoinConditions.prefix0x(await puzzle.encodePuzzle(puz.puzzle));
    const sk = BLS.PrivateKey.from_bytes(puz.privateKey, true);

    const tgt_hex = puzzle.getPuzzleHashFromAddress(tgt_address);
    const change_hex = puzzle.getPuzzleHashFromAddress(change_address);
    const a = bigint_to_bytes(BigInt(coin.amount), { signed: true });
    const pci = Bytes.from(coin.parent_coin_info, "hex");
    const ph = Bytes.from(coin.puzzle_hash, "hex");
    const cont = pci.concat(ph).concat(a);
    const coinname = Bytes.SHA256(cont);
    // const hash = Bytes.SHA256(cont).hex();
    // console.log(hash);

    // const pk = Bytes.from(sk.get_g1().serialize()).hex();
    // console.log("sk", sk, "pk", pk)
    const synthetic_sk = this.calculate_synthetic_secret_key(BLS, sk, Transfer.DEFAULT_HIDDEN_PUZZLE_HASH.raw());
    // console.log("synthetic_sk", Bytes.from(synthetic_sk.serialize()).hex())

    const delegated_puzzle_solution = this.getDelegatedPuzzle([
      CoinConditions.CREATE_COIN(tgt_hex, amount),
      CoinConditions.CREATE_COIN(change_hex, coin.amount - amount - fee),
    ]);
    const delegated_puzzle_solution_treehash = await puzzle.getPuzzleHashFromPuzzle(delegated_puzzle_solution);
    const solution_reveal = "(() " + delegated_puzzle_solution + " ())";
    const solution = CoinConditions.prefix0x(await puzzle.encodePuzzle(solution_reveal));
    // console.log(delegated_puzzle_solution_treehash);


    const message = Uint8Array.from([...Bytes.from(delegated_puzzle_solution_treehash, "hex").raw(), ...coinname.raw(), ...Transfer.AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
    // console.log(synthetic_sk, delegated_puzzle_solution_treehash, coinname, AGG_SIG_ME_ADDITIONAL_DATA,  message);
    // console.log("message hex", Bytes.from(message).hex());

    const signature = BLS.AugSchemeMPL.sign(synthetic_sk, message);
    // console.log(Bytes.from(signature.serialize()).hex());

    const sig = Bytes.from(signature.serialize()).hex();

    return {
      aggregated_signature: CoinConditions.prefix0x(sig),
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

  public getDelegatedPuzzle(conditions: string[][]): string {
    return "(q " + conditions.map(_ => "(" + _.join(" ") + ")").join(" ") + ")";
  }

  private calculate_synthetic_offset(public_key: G1Element, hidden_puzzle_hash: Uint8Array): bigint {
    const blob = Bytes.SHA256(new Uint8Array([...public_key.serialize(), ...hidden_puzzle_hash]));
    let offset = bigint_from_bytes(blob, { signed: true })
    while (offset < 0) offset += Transfer.GROUP_ORDER;
    offset %= Transfer.GROUP_ORDER;
    return offset;
  }

  private calculate_synthetic_secret_key(BLS: ModuleInstance, secret_key: PrivateKey, hidden_puzzle_hash: Uint8Array): PrivateKey {
    const secret_exponent = bigint_from_bytes(Bytes.from(secret_key.serialize()), { signed: true });
    const public_key = secret_key.get_g1();
    const synthetic_offset = this.calculate_synthetic_offset(public_key, hidden_puzzle_hash);
    const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % Transfer.GROUP_ORDER
    const blob = bigint_to_bytes(synthetic_secret_exponent).raw();
    const synthetic_secret_key = BLS.PrivateKey.from_bytes(blob, true)
    return synthetic_secret_key;
  }
}

export default new Transfer();
