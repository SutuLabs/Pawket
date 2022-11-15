import { PrivateKey, G2Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Bytes } from "clvm";
import { CoinSpend, OriginCoin, SpendBundle, UnsignedSpendBundle } from "@/models/wallet";
import { GetParentPuzzleResponse } from "@/models/api";
import { DEFAULT_HIDDEN_PUZZLE_HASH } from "../coin/consts";
import { CoinConditions, ConditionType, Hex, Hex0x, prefix0x, unprefix0x } from "../coin/condition";
import puzzle, { ConditionEntity, PuzzlePrivateKey } from "../crypto/puzzle";
import { TokenPuzzleObserver, TokenPuzzlePrivateKey } from "../crypto/receive";
import stdBundle from "./stdBundle";
import { ConditionOpcode } from "../coin/opcode";
import catBundle from "./catBundle";
import { getCoinNameHex, NetworkContext, NetworkContextWithOptionalApi } from "../coin/coinUtility";
import { Instance } from "../util/instance";
import { calculate_synthetic_secret_key } from "../crypto/sign";

export type GetPuzzleApiCallback = (parentCoinId: string) => Promise<GetParentPuzzleResponse | undefined>;

class Transfer {

  public generateSpendPlan(
    availcoins: SymbolCoins,
    targets: TransferTarget[],
    changeAddress: Hex0x,
    fee: bigint,
    tokenSymbol: string,
  ): SpendPlan {
    const plan: SpendPlan = {};
    for (const symbol in availcoins) {
      if (!Object.prototype.hasOwnProperty.call(availcoins, symbol)) continue;

      const coins = availcoins[symbol];
      const tgts = targets.filter(_ => _.symbol == symbol);

      const outgoingExtra = (symbol == tokenSymbol) ? fee : 0n;
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

    return { coin_spends };
    // return this.getSpendBundle(coin_spends, puzzles, net.chainId);
  }

  public async getSignaturesFromUnsignedSpendBundle(
    ubundle: UnsignedSpendBundle,
    puzzles: TokenPuzzlePrivateKey[],
    chainId: string,
    allSignCheck = false,
  ): Promise<G2Element> {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");
    const puzzleDict: { [key: string]: PuzzlePrivateKey } = Object.assign({}, ...puzzles.flatMap(_ => _.puzzles).map((x) => ({ [unprefix0x(x.synPubKey)]: x })));
    // console.dir(puzzleDict, { depth: 0 });
    const getPuzDetail = (synPubKey: Hex): PuzzlePrivateKey | undefined => { return puzzleDict[synPubKey]; }

    const css = ubundle.coin_spends;
    const sigs: G2Element[] = [];
    for (let i = 0; i < css.length; i++) {
      const coin_spend = css[i];
      if (coin_spend.coin.parent_coin_info == "0x0000000000000000000000000000000000000000000000000000000000000000") continue;
      const result = await puzzle.executePuzzleHex(coin_spend.puzzle_reveal, coin_spend.solution);
      // TODO: if one coin spend contain more than one AGG_SIG_ME, not consider here
      const synPubKeyArgs = result.conditions.filter(_ => _.code == ConditionOpcode.AGG_SIG_ME)[0]?.args[0];
      const synPubKeyUint8 = Array.isArray(synPubKeyArgs) ? undefined : synPubKeyArgs;
      const synPubKey = !synPubKeyUint8 ? undefined : Bytes.from(synPubKeyUint8).hex();

      const puz = !synPubKey ? undefined : getPuzDetail(synPubKey);
      // if (!puz ) {
      //   console.log(`cannot find puzzle by synthetic public key ${synPubKey}`);
      // }
      if (!puz && allSignCheck) throw new Error(`cannot find puzzle by synthetic public key ${synPubKey}`);

      // const puzzle_reveal = await puzzle.disassemblePuzzle(coin_spend.puzzle_reveal);

      const synthetic_sk = puz
        ? calculate_synthetic_secret_key(BLS, puz.privateKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw())
        : undefined;
      const coinname = getCoinNameHex(coin_spend.coin);

      const signature = await this.signSolution(BLS, result.conditions, synthetic_sk, coinname, chainId, allSignCheck);

      sigs.push(signature);
    }

    // console.log(sigs);
    const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);

    return agg_sig;
  }

  public async getSpendBundle(ubundle: SpendBundle | UnsignedSpendBundle | CoinSpend[],
    puzzles: TokenPuzzlePrivateKey[],
    chainId: string,
    allSignCheck = false,
  ): Promise<SpendBundle> {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");

    const bundle: UnsignedSpendBundle | SpendBundle = Array.isArray(ubundle) ? { coin_spends: ubundle } : ubundle;
    let agg_sig = await this.getSignaturesFromUnsignedSpendBundle(bundle, puzzles, chainId, allSignCheck);

    if ("aggregated_signature" in bundle && (bundle as SpendBundle).aggregated_signature)
      agg_sig = BLS.AugSchemeMPL.aggregate([
        agg_sig,
        BLS.G2Element.from_bytes(Bytes.from(unprefix0x((bundle as SpendBundle).aggregated_signature), "hex").raw()),
      ]);
    const sig = Bytes.from(agg_sig.serialize()).hex();
    return {
      aggregated_signature: prefix0x(sig),
      coin_spends: bundle.coin_spends,
    }
  }

  public getDelegatedPuzzle(conditions: (string | string[])[][]): string {
    return "(q " + conditions
      .map(_ => "(" + _
        .map(_ => (typeof _ === "object" ? ("(" + _.join(" ") + ")") : _))
        .join(" ") + ")")
      .join(" ") + ")";
  }

  private async signSolution(
    BLS: ModuleInstance,
    // solution_executed_result: string,
    conds: ConditionEntity[],
    synthetic_sk: PrivateKey | undefined,
    coinname: Bytes,
    chainId: string,
    allSignCheck = false,
  ): Promise<G2Element> {
    const AGG_SIG_ME_ADDITIONAL_DATA = Bytes.from(chainId, "hex");
    // const conds = puzzle.parseConditions(solution_executed_result);
    const sigs: G2Element[] = [];

    for (let i = 0; i < conds.length; i++) {
      const cond = conds[i];
      if (cond.code == ConditionOpcode.AGG_SIG_UNSAFE) {
        throw new Error("not implement");
      }
      else if (cond.code == ConditionOpcode.AGG_SIG_ME) {
        if (!cond.args || cond.args.length != 2) throw new Error("wrong args");
        const args = cond.args as Uint8Array[];
        const msg = Uint8Array.from([...args[1], ...coinname.raw(), ...AGG_SIG_ME_ADDITIONAL_DATA.raw()]);
        const pk_hex = Bytes.from(args[0]).hex();
        if (!synthetic_sk && allSignCheck) throw new Error("synthetic_sk is required. maybe puzzle is not find.");
        if (!synthetic_sk) continue;

        const synthetic_pk_hex = Bytes.from(synthetic_sk.get_g1().serialize()).hex();
        // console.log(synthetic_pk_hex, msg);
        if (pk_hex != synthetic_pk_hex) throw new Error("wrong args due to pk != synthetic_pk");
        const sig = BLS.AugSchemeMPL.sign(synthetic_sk, msg);
        sigs.push(sig);
      }
    }

    const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
    return agg_sig;
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
    // const solution_executed_result = delegated_puzzle_solution;
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
