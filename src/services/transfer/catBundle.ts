import { CoinSpend, OriginCoin } from "../spendbundle";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools";
import { SExp, Tuple } from "clvm";
import { ConditionType, formatAmount, prefix0x, toNumberString } from "../coin/condition";
import puzzle, { PuzzleObserver } from "../crypto/puzzle";
import transfer, { GetPuzzleApiCallback, TokenSpendPlan } from "./transfer";
import { TokenPuzzleObserver } from "../crypto/receive";
import { getCoinName } from "../coin/coinUtility";

export interface LineageProof {
  coinId: string;
  amount: bigint;
  proof: string;
}

class CatBundle {

  public async generateCoinSpends(
    plan: TokenSpendPlan,
    puzzles: TokenPuzzleObserver[],
    additionalConditions: ConditionType[] = [],
    getPuzzle: GetPuzzleApiCallback,
  ): Promise<CoinSpend[]> {
    const coin_spends: CoinSpend[] = [];

    const puzzleDict: { [key: string]: PuzzleObserver } = Object.assign({}, ...puzzles.flatMap(_ => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x })));
    const getPuzDetail = (hash: string) => {
      const puz = puzzleDict[hash];
      if (!puz) throw new Error("cannot find puzzle");
      return puz;
    }

    let subtotal = 0n;
    for (let i = 0; i < plan.coins.length; i++) {
      const coin = plan.coins[i];
      const prevcoin = plan.coins[(i + plan.coins.length - 1) % plan.coins.length]
      const nextcoin = plan.coins[(i + 1) % plan.coins.length]
      const puz = getPuzDetail(coin.puzzle_hash);

      // last coin with proper condition solution
      const inner_puzzle_solution = i == plan.coins.length - 1 ?
        transfer.getSolution(plan.targets, additionalConditions)
        : "(() (q) ())";

      const nextCoin_puz = getPuzDetail(nextcoin.puzzle_hash);
      const nextCoin_pk = nextCoin_puz.synPubKey;
      const nextCoin_inner_puzzle_hash = await puzzle.getPuzzleHashFromSyntheticKey(nextCoin_pk);

      const cs = await this.generateCoinSpend(
        coin, prevcoin, nextcoin, nextCoin_inner_puzzle_hash, subtotal, puz, inner_puzzle_solution, getPuzzle);
      coin_spends.push(cs);
      subtotal += coin.amount;
    }

    return coin_spends;
  }

  public async getLineageProof(parentCoinId: string,
    api: GetPuzzleApiCallback,
    argnum = 3,
  ): Promise<LineageProof> {
    // console.log("parentCoinId", parentCoinId)

    const presp = await api(parentCoinId);
    // console.log(`const presp=${JSON.stringify(presp, null, 2)};`)
    if (!presp) throw new Error("cannot find the coin: " + parentCoinId);
    try {
      const hash = await this.calcLineageProof(presp.puzzleReveal, argnum);
      // console.log("api hash", hash);
      return { coinId: presp.parentParentCoinId, amount: BigInt(presp.amount), proof: hash };
    } catch (err) {
      throw new Error(`error when processing coin[${parentCoinId}]: ` + err);
    }
  }

  private async calcLineageProof(puzzleReveal: string, argnum_of_inner_puzzle: number) {
    puzzleReveal = puzzleReveal.startsWith("0x") ? puzzleReveal.substring(2) : puzzleReveal;
    const curriedPuzzle = await puzzle.disassemblePuzzle(puzzleReveal);
    const curried = assemble(curriedPuzzle);
    const [, args] = uncurry(curried) as Tuple<SExp, SExp>;
    let effectiveArg = args;
    for (let i = 0; i < argnum_of_inner_puzzle - 1; i++) {
      effectiveArg = effectiveArg.rest();
    }
    const trickarg = disassemble(effectiveArg).slice(1, -1);
    if (!trickarg) throw new Error("Cannot get lineage proof out of puzzle: " + curriedPuzzle);
    const hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(trickarg));
    return hash; // getting inner_puzzle hash
  }

  public getCatPuzzleSolution(
    inner_puzzle_solution: string,
    catcoin: OriginCoin,
    prevCoin: OriginCoin,
    nextCoin: OriginCoin,
    nextCoin_inner_puzzle_hash: string,
    subtotal: bigint,
    proof: LineageProof,
  ): string {

    const ljoin = (...args: string[]) => "(" + args.join(" ") + ")";

    // inner_puzzle_solution    ;; if invalid, INNER_PUZZLE will fail
    // lineage_proof            ;; This is the parent's coin info, used to check if the parent was a CAT. Optional if using tail_program. parent_parent_(coin_info puzzle_hash amount)
    const lineage_proof = ljoin(prefix0x(proof.coinId), prefix0x(proof.proof), formatAmount(proof.amount));
    // prev_coin_id             ;; used in this coin's announcement, prev_coin ASSERT_COIN_ANNOUNCEMENT will fail if wrong (parent_coin_name)
    const prev_coin_id = prefix0x(getCoinName(prevCoin));
    // this_coin_info           ;; verified with ASSERT_MY_COIN_ID comsumed coin (parent_coin_info puzzle_hash amount)
    const this_coin_info = ljoin(catcoin.parent_coin_info, catcoin.puzzle_hash, formatAmount(catcoin.amount));
    // next_coin_proof          ;; used to generate ASSERT_COIN_ANNOUNCEMENT (parent_coin_info coin_inner_puzzle_treehash(puzzle_hash -> pk -> inner_puzzle_hash) total_amount)
    const next_coin_proof = ljoin(nextCoin.parent_coin_info, prefix0x(nextCoin_inner_puzzle_hash), formatAmount(nextCoin.amount));
    // prev_subtotal            ;; included in announcement, prev_coin ASSERT_COIN_ANNOUNCEMENT will fail if wrong
    const prev_subtotal = toNumberString(subtotal);
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
    prevCoin: OriginCoin,
    nextCoin: OriginCoin,
    nextCoin_inner_puzzle_hash: string,
    subtotal: bigint,
    puz: PuzzleObserver,
    inner_puzzle_solution: string,
    getPuzzle: GetPuzzleApiCallback,
  ): Promise<CoinSpend> {
    const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
    const solution = await this.generateSolution(
      coin, prevCoin, nextCoin, nextCoin_inner_puzzle_hash, subtotal, inner_puzzle_solution, getPuzzle);
    const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
    return { coin, puzzle_reveal, solution: solution_hex };
  }

  private async generateSolution(
    coin: OriginCoin,
    prevCoin: OriginCoin,
    nextCoin: OriginCoin,
    nextCoin_inner_puzzle_hash: string,
    subtotal: bigint,
    inner_puzzle_solution: string,
    getPuzzle: GetPuzzleApiCallback,
  ): Promise<string> {
    const proof = await this.getLineageProof(coin.parent_coin_info, getPuzzle);
    const solution = this.getCatPuzzleSolution(
      inner_puzzle_solution, coin, prevCoin, nextCoin, nextCoin_inner_puzzle_hash, subtotal, proof);
    return solution;
  }
}

export default new CatBundle();
