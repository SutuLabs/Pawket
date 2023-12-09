import { CoinSpend } from "../spendbundle";
import { CoinConditions, ConditionType, prefix0x } from "../coin/condition";
import puzzle, { PuzzleObserver } from "../crypto/puzzle";
import transfer, { TokenSpendPlan } from "./transfer";
import { TokenPuzzleObserver } from "../crypto/receive";
import { getCoinName } from "../coin/coinUtility";
import { sha256 } from "../offer/bundler";

class StdBundle {
  public async generateCoinSpends(
    plan: TokenSpendPlan,
    puzzles: TokenPuzzleObserver[],
    additionalConditions: ConditionType[] = []
  ): Promise<CoinSpend[]> {
    const coin_spends: CoinSpend[] = [];

    const puzzleDict: { [key: string]: PuzzleObserver } = Object.assign(
      {},
      ...puzzles.flatMap((_) => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x }))
    );
    const getPuzDetail = (hash: string) => {
      const puz = puzzleDict[hash];
      if (!puz) throw new Error("cannot find puzzle");
      return puz;
    };

    for (let i = 0; i < plan.coins.length; i++) {
      const coin = plan.coins[i];
      const pcl = plan.coins.length;
      const nextcoin = plan.coins[(i + 1) % pcl];
      const prevcoin = plan.coins[(i - 1 + pcl) % pcl];
      const puz = getPuzDetail(coin.puzzle_hash);

      const conditions: ConditionType[] = [];
      if (plan.coins.length > 1) {
        conditions.push(
          ...[
            CoinConditions.CREATE_COIN_ANNOUNCEMENT(sha256(getCoinName(coin), getCoinName(nextcoin))), // create announce for next coin to assert
            CoinConditions.ASSERT_COIN_ANNOUNCEMENT(
              sha256(getCoinName(prevcoin), sha256(getCoinName(prevcoin), getCoinName(coin)))
            ),
          ]
        );
      }

      if (i == plan.coins.length - 1) {
        conditions.push(...additionalConditions);
      }

      const solution =
        i == plan.coins.length - 1
          ? transfer.getSolution(plan.targets, conditions)
          : `(() ${transfer.getDelegatedPuzzle(conditions)} ())`;
      const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puz.puzzle));
      const solution_hex = prefix0x(await puzzle.encodePuzzle(solution));
      coin_spends.push({ coin, puzzle_reveal, solution: solution_hex });
    }

    return coin_spends;
  }
}

export default new StdBundle();
