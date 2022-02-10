import { PrivateKey, G2Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes } from "clvm";
import { OriginCoin, SpendBundle } from "@/models/wallet";
import { AGG_SIG_ME_ADDITIONAL_DATA } from "../coin/consts";
import { CoinConditions } from "../coin/condition";
import puzzle, { PuzzleDetail } from "../crypto/puzzle";
import transfer from "./transfer";

class StdBundle {
  public async generateSpendBundle(
    coins: OriginCoin[],
    puzzles: PuzzleDetail[],
    tgt_address: string,
    amount: bigint,
    fee: bigint,
    change_address: string): Promise<SpendBundle | null> {
    return await transfer.generateSpendBundleInternal(coins, puzzles,
      async (coin) => {
        const delegated_puzzle_solution = this.getDelegatedPuzzleSolution(coin, tgt_address, amount, fee, change_address);
        const solution_executed_result = delegated_puzzle_solution;
        const solution_reveal = "(() " + delegated_puzzle_solution + " ())";

        return { solution: solution_reveal, result: solution_executed_result };
      },
      this.signStdSolution,
      amount, fee);
  }

  private async signStdSolution(BLS: ModuleInstance, solution_executed_result: string, synthetic_sk: PrivateKey, coinname: Bytes): Promise<G2Element> {
    const solution_executed_result_treehash = await puzzle.getPuzzleHashFromPuzzle(solution_executed_result);
    const message = Uint8Array.from([...Bytes.from(solution_executed_result_treehash, "hex").raw(), ...coinname.raw(), ...AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
    const signature = BLS.AugSchemeMPL.sign(synthetic_sk, message);

    return signature;
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

    const delegated_puzzle_solution = transfer.getDelegatedPuzzle(conditions);
    return delegated_puzzle_solution;
  }
}

export default new StdBundle();
