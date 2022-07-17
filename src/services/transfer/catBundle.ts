import { Bytes } from "clvm";
import { CoinSpend, OriginCoin } from "@/models/wallet";
import { GetParentPuzzleRequest, GetParentPuzzleResponse } from "@/models/api";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools";
import { SExp, Tuple } from "clvm";
import { ConditionType, formatAmount, prefix0x } from "../coin/condition";
import puzzle, { PuzzleDetail } from "../crypto/puzzle";
import transfer, { GetPuzzleApiCallback, TokenSpendPlan } from "./transfer";
import { TokenPuzzleDetail } from "../crypto/receive";
import { rpcUrl } from "@/store/modules/network";
import { getCoinName } from "../coin/coinUtility";

export interface LineageProof {
  coinId: string;
  amount: bigint;
  proof: string;
}

class CatBundle {

  public async generateCoinSpends(
    plan: TokenSpendPlan,
    puzzles: TokenPuzzleDetail[],
    additionalConditions: ConditionType[] = [],
    getPuzzle: GetPuzzleApiCallback | null = null,
  ): Promise<CoinSpend[]> {
    const coin_spends: CoinSpend[] = [];

    const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign({}, ...puzzles.flatMap(_ => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x })));
    const getPuzDetail = (hash: string) => {
      const puz = puzzleDict[hash];
      if (!puz) throw new Error("cannot find puzzle");
      return puz;
    }

    for (let i = 0; i < plan.coins.length - 1; i++) {
      const coin = plan.coins[i];
      const puz = getPuzDetail(coin.puzzle_hash);

      const inner_puzzle_solution = "(() (q) ())";

      const cs = await this.generateCoinSpend(coin, puz, inner_puzzle_solution, getPuzzle);
      coin_spends.push(cs);
    }

    // last coin with proper condition solution
    {
      const coin = plan.coins[plan.coins.length - 1];
      const puz = getPuzDetail(coin.puzzle_hash);

      const inner_puzzle_solution = transfer.getSolution(plan.targets, additionalConditions);

      const cs = await this.generateCoinSpend(coin, puz, inner_puzzle_solution, getPuzzle);
      coin_spends.push(cs);
    }

    return coin_spends;
  }

  private async getLineageProofPuzzle(parentCoinId: string): Promise<GetParentPuzzleResponse> {
    const resp = await fetch(rpcUrl() + "Wallet/get-puzzle", {
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

  public async getLineageProof(parentCoinId: string,
    api: GetPuzzleApiCallback | null = null,
    argnum = 3,
  ): Promise<LineageProof> {
    if (!api) api = this.getLineageProofPuzzle;
    // console.log("parentCoinId", parentCoinId)
    const calcLineageProof = async (puzzleReveal: string) => {
      puzzleReveal = puzzleReveal.startsWith("0x") ? puzzleReveal.substring(2) : puzzleReveal;
      const curriedPuzzle = await puzzle.disassemblePuzzle(puzzleReveal);
      const curried = assemble(curriedPuzzle);
      const [, args] = uncurry(curried) as Tuple<SExp, SExp>;
      let effectiveArg = args;
      for (let i = 0; i < argnum - 1; i++) {
        effectiveArg = effectiveArg.rest();
      }
      const trickarg = disassemble(effectiveArg).slice(1, -1);
      const hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(trickarg));
      return hash;
    }

    const presp = await api(parentCoinId);
    if (!presp) throw "cannot find the coin";
    const hash = await calcLineageProof(presp.puzzleReveal);
    // console.log("api hash", hash);
    return { coinId: presp.parentParentCoinId, amount: BigInt(presp.amount), proof: hash };
  }

  public getCatPuzzleSolution(
    inner_puzzle_solution: string,
    catcoin: OriginCoin,
    proof: LineageProof,
    inner_puzzle_hash: string,
  ): string {

    const ljoin = (...args: string[]) => "(" + args.join(" ") + ")";

    // inner_puzzle_solution    ;; if invalid, INNER_PUZZLE will fail
    // lineage_proof            ;; This is the parent's coin info, used to check if the parent was a CAT. Optional if using tail_program. parent_parent_(coin_info puzzle_hash amount)
    const lineage_proof = ljoin(prefix0x(proof.coinId), prefix0x(proof.proof), formatAmount(proof.amount));
    // prev_coin_id             ;; used in this coin's announcement, prev_coin ASSERT_COIN_ANNOUNCEMENT will fail if wrong (parent_coin_name)
    const prev_coin_id = prefix0x(getCoinName(catcoin));
    // this_coin_info           ;; verified with ASSERT_MY_COIN_ID comsumed coin (parent_coin_info puzzle_hash amount)
    const this_coin_info = ljoin(catcoin.parent_coin_info, catcoin.puzzle_hash, formatAmount(catcoin.amount));
    // next_coin_proof          ;; used to generate ASSERT_COIN_ANNOUNCEMENT (parent_coin_info coin_inner_puzzle_treehash(puzzle_hash -> pk -> inner_puzzle_hash) total_amount)
    const next_coin_proof = ljoin(catcoin.parent_coin_info, prefix0x(inner_puzzle_hash), formatAmount(catcoin.amount));
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
    // console.log("solution", solution);

    return solution;
  }



  private async generateCoinSpend(
    coin: OriginCoin,
    puz: PuzzleDetail,
    inner_puzzle_solution: string,
    getPuzzle: GetPuzzleApiCallback | null = null,
  ): Promise<CoinSpend> {
    const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
    const solution = await this.generateSolution(coin, puz, inner_puzzle_solution, getPuzzle);
    const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
    return { coin, puzzle_reveal, solution: solution_hex };
  }

  private async generateSolution(
    coin: OriginCoin,
    puz: PuzzleDetail,
    inner_puzzle_solution: string,
    getPuzzle: GetPuzzleApiCallback | null = null,
  ): Promise<string> {
    const proof = await this.getLineageProof(coin.parent_coin_info, getPuzzle);
    const pk = Bytes.from(puz.privateKey.get_g1().serialize()).hex();
    const inner_puzzle_hash = await puzzle.getPuzzleHash(pk);
    const solution = this.getCatPuzzleSolution(inner_puzzle_solution, coin, proof, inner_puzzle_hash);
    return solution;
  }
}

export default new CatBundle();
