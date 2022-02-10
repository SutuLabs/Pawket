import { PrivateKey, G2Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes } from "clvm";
import { OriginCoin, SpendBundle } from "@/models/wallet";
import { GetParentPuzzleRequest, GetParentPuzzleResponse } from "@/models/api";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools/browser";
import { SExp, Tuple } from "clvm";
import { AGG_SIG_ME_ADDITIONAL_DATA } from "../coin/consts";
import { ConditionOpcode } from "../coin/opcode";
import { CoinConditions, formatAmount, prefix0x } from "../coin/condition";
import puzzle, { PuzzleDetail } from "../crypto/puzzle";
import transfer, { GetPuzzleApiCallback } from "./transfer";

interface LineageProof {
  coinId: string;
  amount: bigint;
  proof: string;
}

interface ConditionEntity {
  code: number;
  args: (Uint8Array | undefined)[];
}

class CatBundle {

  public async generateCatSpendBundle(
    coins: OriginCoin[],
    puzzles: PuzzleDetail[],
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string,
    memo: string | null,
    getPuzzle: GetPuzzleApiCallback | null = null,
  ): Promise<SpendBundle | null> {
    return await transfer.generateSpendBundleInternal(coins, puzzles,
      async (coin, puzzle_reveal_hex) => {
        if (!getPuzzle) getPuzzle = this.getLineageProofPuzzle;
        const proof = await this.getLineageProof(coin.parent_coin_info, getPuzzle);
        // console.log(proof);
        const solution_reveal = this.getCatPuzzleSolution(coin, proof, memo, tgt_address, amount, fee, change_address);
        const puzzle_reveal = await puzzle.disassemblePuzzle(puzzle_reveal_hex);

        const solution_executed_result = await puzzle.calcPuzzleResult(puzzle_reveal, solution_reveal);
        if (solution_executed_result.startsWith("FAIL")) {
          console.warn(`brun '${puzzle_reveal}' '${solution_reveal}'`);
          throw `Failed to execute, ${solution_executed_result}`;
        }

        return { solution: solution_reveal, result: solution_executed_result }
      },
      this.signCatSolution,
      amount, fee);
  }

  private async signCatSolution(BLS: ModuleInstance, solution_executed_result: string, synthetic_sk: PrivateKey, coinname: Bytes): Promise<G2Element> {

    const parseConditions = (conditonString: string): ConditionEntity[] => {
      console.log("start")
      const conds = Array.from(assemble(conditonString).as_iter())
        .map(cond => ({
          code: cond.first().atom?.at(0) ?? 0,
          args: Array.from(cond.rest().as_iter()).map(_ => _.atom?.raw())
        }));

      return conds;
    };

    const conds = parseConditions(solution_executed_result);
    // console.log("conditions", solution_executed_result, conds);

    const sigs: G2Element[] = [];
    const synthetic_pk_hex = Bytes.from(synthetic_sk.get_g1().serialize()).hex();

    for (let i = 0; i < conds.length; i++) {
      const cond = conds[i];
      if (cond.code == ConditionOpcode.AGG_SIG_UNSAFE) {
        throw "not implement";
      }
      else if (cond.code == ConditionOpcode.AGG_SIG_ME) {
        if (!cond.args || cond.args.length != 2) throw "wrong args"
        const args = cond.args as Uint8Array[];
        const msg = Uint8Array.from([...args[1], ...coinname.raw(), ...AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
        // const pk = BLS.G1Element.from_bytes(args[0]);
        const pk_hex = Bytes.from(args[0]).hex();
        if (pk_hex != synthetic_pk_hex) throw "wrong args due to pk != synthetic_pk";
        const sig = BLS.AugSchemeMPL.sign(synthetic_sk, msg);
        sigs.push(sig);
      }
    }

    const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
    return agg_sig;
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
    // console.log("parentCoinId", parentCoinId)
    const calcLineageProof = async (puzzleReveal: string) => {
      puzzleReveal = puzzleReveal.startsWith("0x") ? puzzleReveal.substring(2) : puzzleReveal;
      const curriedPuzzle = await puzzle.disassemblePuzzle(puzzleReveal);
      const curried = assemble(curriedPuzzle);
      const [, args] = uncurry(curried) as Tuple<SExp, SExp>;
      const thirdarg = disassemble(args.rest().rest());
      const trickarg = thirdarg.slice(1, -1);
      // console.log("api puzzle", trickarg);
      const hash = await puzzle.getPuzzleHashFromPuzzle(trickarg);
      return hash;
    }

    const presp = await api(parentCoinId);
    const hash = await calcLineageProof(presp.puzzleReveal);
    // console.log("api hash", hash);
    return { coinId: presp.parentParentCoinId, amount: BigInt(presp.amount), proof: hash };
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
    const lineage_proof = ljoin(prefix0x(proof.coinId), prefix0x(proof.proof), formatAmount(proof.amount));
    // prev_coin_id             ;; used in this coin's announcement, prev_coin ASSERT_COIN_ANNOUNCEMENT will fail if wrong (parent_coin_name)
    const prev_coin_id = prefix0x(transfer.getCoinName(coin).hex());
    // this_coin_info           ;; verified with ASSERT_MY_COIN_ID comsumed coin (parent_coin_info puzzle_hash amount)
    const this_coin_info = ljoin(coin.parent_coin_info, coin.puzzle_hash, formatAmount(coin.amount));
    // next_coin_proof          ;; used to generate ASSERT_COIN_ANNOUNCEMENT (parent_coin_info coin_inner_puzzle_treehash(tgt_puzzle_hash) total_amount)
    const next_coin_proof = ljoin(coin.parent_coin_info, prefix0x(tgt_hex), formatAmount(coin.amount));
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

    const delegated_puzzle_solution = transfer.getDelegatedPuzzle(conditions);
    // console.log(conditions, delegated_puzzle_solution);
    return delegated_puzzle_solution;
  }

  subtotals_for_deltas(deltas: number[]): number[] {
    // Given a list of deltas corresponding to input coins, create the "subtotals" list
    // needed in solutions spending those coins.
    const subtotals: number[] = [];
    let subtotal = 0
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      subtotals.push(subtotal)
      subtotal += delta
    }

    // tweak the subtotals so the smallest value is 0
    const subtotal_offset = Math.min(...subtotals);
    const offset_subtotals = subtotals.map(_ => _ - subtotal_offset)
    return offset_subtotals;
  }

  get_delta(args: number[], amount: bigint) {
    // for _ in conditions.get(ConditionOpcode.CREATE_COIN, []):
    let total = 0n;
    if (args[1] != -113)
      total += BigInt(args[1]);
    return amount - total;
    // deltas.append(spend_info.coin.amount - total)
  }
}

export default new CatBundle();
