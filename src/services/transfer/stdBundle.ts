import { CoinSpend } from "../spendbundle";
import { ConditionType, prefix0x } from "../coin/condition";
import puzzle, { PuzzleObserver } from "../crypto/puzzle";
import transfer, { TokenSpendPlan } from "./transfer";
import { TokenPuzzleObserver } from "../crypto/receive";

class StdBundle {

  public async generateCoinSpends(
    plan: TokenSpendPlan,
    puzzles: TokenPuzzleObserver[],
    additionalConditions: ConditionType[] = [],
  ): Promise<CoinSpend[]> {
    const coin_spends: CoinSpend[] = [];

    const puzzleDict: { [key: string]: PuzzleObserver } = Object.assign({}, ...puzzles.flatMap(_ => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x })));
    const getPuzDetail = (hash: string) => {
      const puz = puzzleDict[hash];
      if (!puz) throw new Error("cannot find puzzle");
      return puz;
    }

    for (let i = 0; i < plan.coins.length - 1; i++) {
      const coin = plan.coins[i];
      const puz = getPuzDetail(coin.puzzle_hash);

      const solution = "(() (q) ())";
      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
      const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
      coin_spends.push({ coin, puzzle_reveal, solution: solution_hex })
    }

    // last coin with proper condition solution
    {
      const coin = plan.coins[plan.coins.length - 1];
      const puz = getPuzDetail(coin.puzzle_hash);

      const solution = transfer.getSolution(plan.targets, additionalConditions);
      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
      const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
      coin_spends.push({ coin, puzzle_reveal, solution: solution_hex })
    }

    return coin_spends;
  }
}

export default new StdBundle();
