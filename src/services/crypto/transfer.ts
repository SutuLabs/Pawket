import { PrivateKey, G1Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes, bigint_from_bytes, bigint_to_bytes } from "clvm";
import { OriginCoin, SpendBundle } from "@/models/wallet";
import store from "@/store";
import puzzle, { PuzzleDetail } from "./puzzle";
import { GetParentPuzzleRequest, GetParentPuzzleResponse } from "@/models/api";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools/browser";
import { SExp, Tuple } from "clvm";

interface PuzzleSolutionResult {
  solution: string;
  result: string;
}

interface LineageProof {
  coinId: string;
  amount: bigint;
  proof: string;
}
export type GetPuzzleApiCallback = (parentCoinId: string) => Promise<GetParentPuzzleResponse>;

class CoinConditions {
  public static CREATE_COIN(puzzlehash: string, amount: bigint): string[] {
    return ["51", this.prefix0x(puzzlehash), this.formatAmount(amount)];
  }
  public static CREATE_COIN_Extend(puzzlehash: string, amount: bigint, id: string, memo: string | null): (string | string[])[] {
    return [...this.CREATE_COIN(puzzlehash, amount), [this.prefix0x(id), memo ? `"${memo}"` : undefined].filter(_ => _ !== undefined) as string[]];
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

  public static formatAmount(amount: bigint): string {
    return this.prefix0x(Bytes.from(bigint_to_bytes(amount, { signed: true })).hex());
  }
}

class Transfer {
  static readonly GROUP_ORDER = BigInt(bigint_from_bytes(Bytes.from("0x73EDA753299D7D483339D80809A1D80553BDA402FFFE5BFEFFFFFFFF00000001", "hex")));
  static readonly DEFAULT_HIDDEN_PUZZLE_HASH = Bytes.from("711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699", "hex");
  static readonly AGG_SIG_ME_ADDITIONAL_DATA = Bytes.from("ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb", "hex");

  public async generateSpendBundle(
    coins: OriginCoin[],
    sk_hex: string,
    puzzles: PuzzleDetail[],
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): Promise<SpendBundle | null> {
    return await this.generateSpendBundleInternal(coins, sk_hex, puzzles,
      async (coin) => {
        const delegated_puzzle_solution = this.getDelegatedPuzzleSolution(coin, tgt_address, amount, fee, change_address);
        const solution_executed_result = delegated_puzzle_solution;
        const solution_reveal = "(() " + delegated_puzzle_solution + " ())";
        return { solution: solution_reveal, result: solution_executed_result }
      },
      amount, fee);
  }

  public async generateCatSpendBundle(
    coins: OriginCoin[],
    sk_hex: string,
    puzzles: PuzzleDetail[],
    assetId: string,
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string,
    memo: string | null,
    getPuzzle: GetPuzzleApiCallback | null = null,
  ): Promise<SpendBundle | null> {
    return await this.generateSpendBundleInternal(coins, sk_hex, puzzles,
      async (coin, puzzle_reveal_hex) => {
        if (!getPuzzle) getPuzzle = this.getLineageProofPuzzle;
        const proof = await this.getLineageProof(coin.parent_coin_info, getPuzzle);
        // console.log(proof);
        const solution_reveal = this.getCatPuzzleSolution(coin, proof, memo, tgt_address, amount, fee, change_address);
        const puzzle_reveal = await puzzle.disassemblePuzzle(puzzle_reveal_hex);
        console.log(`brun '${puzzle_reveal}' '${solution_reveal}'`);
        // console.log(`solution ${solution_reveal}`);
        const solution_executed_result = await puzzle.calcPuzzleResult(puzzle_reveal, solution_reveal);
        return { solution: solution_reveal, result: solution_executed_result }
      },
      amount, fee);
  }

  private async generateSpendBundleInternal(
    coins: OriginCoin[],
    sk_hex: string,
    puzzles: PuzzleDetail[],
    getPuzzlesSolutionResult: (coin: OriginCoin, puzzle_reveal: string) => Promise<PuzzleSolutionResult>,
    amount: bigint,
    fee: bigint): Promise<SpendBundle | null> {
    if (!store.state.app.bls) return null;
    const BLS = store.state.app.bls;
    if (coins.length < 1) return null;
    const coin = this.findPossibleSmallest(coins, amount + fee);
    if (!coin) return null;
    if (amount + fee > coin.amount) return null;

    const gen_sk = BLS.PrivateKey.from_bytes(Bytes.from(sk_hex, "hex").raw(), true);

    const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign({}, ...puzzles.map((x) => ({ [CoinConditions.prefix0x(x.hash)]: x })));
    const puz = puzzleDict[coin.puzzle_hash];
    if (!puz) return null;
    // console.log("ddd5")
    const puzzle_reveal = CoinConditions.prefix0x(await puzzle.encodePuzzle(puz.puzzle));
    const sk = puz.privateKey;

    const coinname = this.getCoinName(coin);

    const synthetic_sk = this.calculate_synthetic_secret_key(BLS, sk, Transfer.DEFAULT_HIDDEN_PUZZLE_HASH.raw());
    // console.log("beforepsr", synthetic_sk);
    const psr = await getPuzzlesSolutionResult(coin, puzzle_reveal);
    // console.log("psr", psr);
    const solution_executed_result_treehash = await puzzle.getPuzzleHashFromPuzzle(psr.result);
    const solution = CoinConditions.prefix0x(await puzzle.encodePuzzle(psr.solution));

    const message = Uint8Array.from([...Bytes.from(solution_executed_result_treehash, "hex").raw(), ...coinname.raw(), ...Transfer.AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
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

  private getDelegatedPuzzleSolution(
    coin: OriginCoin,
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): string {
    const tgt_hex = puzzle.getPuzzleHashFromAddress(tgt_address);
    const change_hex = puzzle.getPuzzleHashFromAddress(change_address);

    const conditions = [];

    const remainder = coin.amount - amount - fee;
    conditions.push(CoinConditions.CREATE_COIN(tgt_hex, amount));
    if (remainder > 0)
      conditions.push(CoinConditions.CREATE_COIN(change_hex, remainder));

    const delegated_puzzle_solution = this.getDelegatedPuzzle(conditions);
    return delegated_puzzle_solution;
  }

  private getCatInnerPuzzleSolution(
    coin: OriginCoin,
    memo: string | null,
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): string {
    const tgt_hex = puzzle.getPuzzleHashFromAddress(tgt_address);
    const change_hex = puzzle.getPuzzleHashFromAddress(change_address);

    const conditions = [];

    const remainder = coin.amount - amount - fee;
    conditions.push(CoinConditions.CREATE_COIN_Extend(tgt_hex, amount, tgt_hex, memo));
    if (remainder > 0)
      conditions.push(CoinConditions.CREATE_COIN(change_hex, remainder));

    const delegated_puzzle_solution = this.getDelegatedPuzzle(conditions);
    // console.log(conditions, delegated_puzzle_solution);
    return delegated_puzzle_solution;
  }

  private getCatPuzzleSolution(
    coin: OriginCoin,
    proof: LineageProof,
    memo: string | null,
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): string {

    const ljoin = (...args: string[]) => "(" + args.join(" ") + ")";

    const tgt_hex = puzzle.getPuzzleHashFromAddress(tgt_address);
    // inner_puzzle_solution    ;; if invalid, INNER_PUZZLE will fail
    const inner_puzzle_solution =
      "(() " + this.getCatInnerPuzzleSolution(coin, memo, tgt_address, amount, fee, change_address) + " ())";
    // lineage_proof            ;; This is the parent's coin info, used to check if the parent was a CAT. Optional if using tail_program. parent_parent_(coin_info puzzle_hash amount)
    const lineage_proof = ljoin(CoinConditions.prefix0x(proof.coinId), CoinConditions.prefix0x(proof.proof), CoinConditions.formatAmount(proof.amount));
    // prev_coin_id             ;; used in this coin's announcement, prev_coin ASSERT_COIN_ANNOUNCEMENT will fail if wrong (parent_coin_name)
    const prev_coin_id = CoinConditions.prefix0x(this.getCoinName(coin).hex());
    // this_coin_info           ;; verified with ASSERT_MY_COIN_ID comsumed coin (parent_coin_info puzzle_hash amount)
    const this_coin_info = ljoin(coin.parent_coin_info, coin.puzzle_hash, CoinConditions.formatAmount(coin.amount));
    // next_coin_proof          ;; used to generate ASSERT_COIN_ANNOUNCEMENT (parent_coin_info target_address_puzzle_hash(one of largest or change) total_amount)
    const next_coin_proof = ljoin(coin.parent_coin_info, CoinConditions.prefix0x(tgt_hex), CoinConditions.formatAmount(coin.amount));
    // prev_subtotal            ;; included in announcement, prev_coin ASSERT_COIN_ANNOUNCEMENT will fail if wrong
    const prev_subtotal = "()";
    // extra_delta              ;; this is the "legal discrepancy" between your real delta and what you're announcing your delta is
    const extra_delta = "()";

    const solution = ljoin(
      inner_puzzle_solution,
      lineage_proof,
      prev_coin_id,
      this_coin_info,
      next_coin_proof,
      prev_subtotal,
      extra_delta,
    );
    // console.log("inner_solution", inner_puzzle_solution);
    // console.log("solution", solution);

    return solution;
  }

  private async getLineageProofPuzzle(parentCoinId: string): Promise<GetParentPuzzleResponse> {
    const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/get-puzzle", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(<GetParentPuzzleRequest>{
        parentCoinId
      }),
    });

    const presp = await resp.json() as GetParentPuzzleResponse;
    return presp;
  }

  private async getLineageProof(parentCoinId: string, api: GetPuzzleApiCallback): Promise<LineageProof> {
    const presp = await api(parentCoinId);
    const puzzleReveal = presp.puzzleReveal.startsWith("0x") ? presp.puzzleReveal.substring(2) : presp.puzzleReveal;
    const curriedPuzzle = await puzzle.disassemblePuzzle(puzzleReveal);
    const curried = assemble(curriedPuzzle);
    const [, args] = uncurry(curried) as Tuple<SExp, SExp>;
    const thirdarg = disassemble(args.rest().rest());
    const trickarg = thirdarg.slice(1, -1);
    // console.log(trickarg);
    const hash = await puzzle.getPuzzleHashFromPuzzle(trickarg);
    // console.log(trickarg, hash);

    return { coinId: presp.parentParentCoinId, amount: BigInt(presp.amount), proof: hash };
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
