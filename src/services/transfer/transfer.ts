import { CoinSpend, OriginCoin, UnsignedSpendBundle } from "../spendbundle";
import { GetParentPuzzleResponse } from "@/models/api";
import { CoinConditions, ConditionType, Hex0x } from "../coin/condition";
import { TokenPuzzleObserver } from "../crypto/receive";
import stdBundle from "./stdBundle";
import catBundle from "./catBundle";
import { NetworkContext, NetworkContextWithOptionalApi } from "../coin/coinUtility";

export type GetPuzzleApiCallback = (parentCoinId: string) => Promise<GetParentPuzzleResponse | undefined>;

class Transfer {

  public generateSpendPlan(
    availcoins: SymbolCoins,
    targets: TransferTarget[],
    changeAddress: Hex0x,
    fee: bigint | undefined = undefined,
    tokenSymbol: string | undefined = undefined,
  ): SpendPlan {
    const plan: SpendPlan = {};
    for (const symbol in availcoins) {
      if (!Object.prototype.hasOwnProperty.call(availcoins, symbol)) continue;

      const coins = availcoins[symbol];
      const tgts = targets.filter(_ => _.symbol == symbol);

      const outgoingExtra = ((symbol == tokenSymbol) ? fee : 0n) ?? 0n;
      const outgoingTotal = tgts.reduce((acc, cur) => acc + cur.amount, 0n) + outgoingExtra;
      const incomingCoins = this.findCoins(coins, outgoingTotal);

      const incomingTotal = incomingCoins.reduce((acc, cur) => acc + cur.amount, 0n);

      const change = incomingTotal - outgoingTotal;
      if (change < 0n)
        throw new Error(`not enough balance to transfer ${symbol}, lacking ${outgoingTotal - incomingTotal}`);

      const transferTargets: TransferTarget[] = [];
      transferTargets.push(...tgts);
      if (change > 0)
        transferTargets.push({ symbol, address: changeAddress, amount: change })

      if (incomingCoins.length > 0)
        plan[symbol] = { coins: incomingCoins, targets: transferTargets };
    }

    return plan;
  }

  public async generateSpendBundleWithoutCat(
    plan: SpendPlan,
    puzzles: TokenPuzzleObserver[],
    catAdditionalConditions: ConditionType[],
    net: NetworkContextWithOptionalApi,
  ): Promise<UnsignedSpendBundle> {
    return await this.generateSpendBundleInternal(plan, puzzles, catAdditionalConditions, net);
  }

  public async generateSpendBundleIncludingCat(
    plan: SpendPlan,
    puzzles: TokenPuzzleObserver[],
    catAdditionalConditions: ConditionType[],
    net: NetworkContext,
  ): Promise<UnsignedSpendBundle> {
    return await this.generateSpendBundleInternal(plan, puzzles, catAdditionalConditions, net);
  }

  public async generateSpendBundleInternal(
    plan: SpendPlan,
    puzzles: TokenPuzzleObserver[],
    catAdditionalConditions: ConditionType[],
    net: NetworkContextWithOptionalApi,
  ): Promise<UnsignedSpendBundle> {
    const coin_spends: CoinSpend[] = [];

    for (const symbol in plan) {
      if (!Object.prototype.hasOwnProperty.call(plan, symbol)) continue;

      const tp = plan[symbol];
      if (symbol == net.symbol) {
        coin_spends.push(... await stdBundle.generateCoinSpends(tp, puzzles));
      } else {
        if (!net.api) throw new Error(`getPuzzle cannot be null when composing cat[${symbol}] spendbundle other than native token[${net.symbol}]`);
        coin_spends.push(... await catBundle.generateCoinSpends(tp, puzzles, catAdditionalConditions, net.api));
      }
    }

    return new UnsignedSpendBundle(coin_spends);
  }

  public getDelegatedPuzzle(conditions: (string | string[])[][]): string {
    return "(q " + conditions
      .map(_ => "(" + _
        .map(_ => (typeof _ === "object" ? ("(" + _.join(" ") + ")") : _))
        .join(" ") + ")")
      .join(" ") + ")";
  }

  private findCoins(coins: OriginCoin[], num: bigint): OriginCoin[] {
    const sortcoins = coins.sort((a, b) => Number(a.amount - b.amount)); // ascending
    const outcoins: OriginCoin[] = [];

    // find smallest coins
    for (let i = 0; i < sortcoins.length; i++) {
      if (num <= 0) break;
      const coin = sortcoins[i];
      outcoins.push(coin);
      num -= coin.amount;
    }

    // remove smallest coins if larger coin already match output
    for (let i = 0; i < outcoins.length; i++) {
      const coin = outcoins[i];
      if (num + coin.amount > 0) {
        break;
      }
      outcoins.splice(i, 1);
      i--;// fix array index change due to splice
      num += coin.amount;
    }

    return outcoins;
  }

  private findPossibleSmallest(coins: OriginCoin[], num: bigint): OriginCoin[] {
    if (num == 0n) return [];

    const sortcoins = coins.sort((a, b) => Number(a.amount - b.amount));
    for (let i = 0; i < sortcoins.length; i++) {
      const coin = sortcoins[i];
      if (coin.amount >= num) return [coin];
    }

    return [];
  }

  public getSolution(targets: TransferTarget[], additionalConditions: ConditionType[]): string {

    const conditions: ConditionType[] = [];

    for (let i = 0; i < targets.length; i++) {
      const tgt = targets[i];
      if (tgt.memos)
        conditions.push(CoinConditions.CREATE_COIN_Extend(tgt.address, tgt.amount, tgt.memos));
      else
        conditions.push(CoinConditions.CREATE_COIN(tgt.address, tgt.amount));
    }

    if (additionalConditions && additionalConditions.length > 0)
      conditions.push(...additionalConditions);

    const delegated_puzzle_solution = this.getDelegatedPuzzle(conditions);
    const solution_reveal = "(() " + delegated_puzzle_solution + " ())";

    return solution_reveal;
  }
}

export type SymbolCoins = {
  [symbol: string]: OriginCoin[]
};

export interface SpendPlan {
  [symbol: string]: TokenSpendPlan;
}

export interface TokenSpendPlan {
  coins: OriginCoin[];
  targets: TransferTarget[];
}

export interface TransferTarget {
  symbol: string;
  address: Hex0x;
  amount: bigint;
  memos?: string[];
}

export default new Transfer();
