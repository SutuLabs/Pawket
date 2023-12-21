import { TokenPuzzleObserver } from "../crypto/receive";
import { UnsignedSpendBundle, combineSpendBundle } from "../spendbundle";
import transfer, { TransferTarget, SymbolCoins } from "../transfer/transfer";
import { NetworkContext } from "./coinUtility";
import { Hex0x } from "./condition";
import { getBootstrapSpendBundle } from "./nft";
import { analyzeP2Coin } from "./p2";

export type InscriptionMintMode = "direct" | "combine" | "proxy";

export async function inscribeMintSpendBundle(
  mode: InscriptionMintMode,
  tgt_hex: Hex0x,
  change_hex: Hex0x,
  availcoins: SymbolCoins,
  service_hex: Hex0x,
  service_fee: bigint,
  net_fee: bigint,
  repeat: number,
  memo: string,
  observers: TokenPuzzleObserver[],
  net: NetworkContext,
  proxy_sk?: string
): Promise<{ repeatMojo: number; bundle: UnsignedSpendBundle }> {
  const tgts: TransferTarget[] = [{ address: service_hex, amount: service_fee, symbol: net.symbol, memos: [] }];

  let ubundle: UnsignedSpendBundle;
  let repeatMojo = 1n;
  if (mode == "proxy") {
    const ob = observers;
    const ms = Array(repeat).fill([memo]);
    const init = repeat == 1 ? [[memo]] : undefined;

    ubundle = await getBootstrapSpendBundle(tgt_hex, change_hex, net_fee, availcoins, ob, repeat, net, proxy_sk, init, ms, tgts);
    repeatMojo = BigInt(repeat);
  } else if (mode == "direct") {
    repeatMojo = 0n;
    for (let i = 0; i < repeat; i++) {
      const amt = BigInt(i + 1);
      tgts.push({ address: tgt_hex, amount: amt, symbol: net.symbol, memos: [memo] });
      repeatMojo += amt;
    }

    const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, BigInt(net_fee), net.symbol);
    ubundle = await transfer.generateSpendBundleWithoutCat(plan, observers, [], net);
  } else {
    if (repeat <= 1) throw new Error("repeat must greater than 1");
    repeatMojo = 0n;
    for (let i = 0; i < repeat; i++) {
      const amt = BigInt(i + 1);
      tgts.push({ address: tgt_hex, amount: amt, symbol: net.symbol, memos: [memo] });
      repeatMojo += amt;
    }

    const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, BigInt(net_fee), net.symbol);
    const transferBundle = await transfer.generateSpendBundleWithoutCat(plan, observers, [], net);

    const coin = transferBundle.coin_spends[transferBundle.coin_spends.length - 1];
    const analysis = await analyzeP2Coin(coin.puzzle_reveal, coin.solution, coin.coin);

    if (!analysis || analysis.coins.length != repeat) throw new Error("Producing coins without identical repeat count");
    const gatherCoins: SymbolCoins = {
      [net.symbol]: analysis.coins.map((_) => ({ parent_coin_info: _.parent, puzzle_hash: _.to, amount: _.amount })),
    };

    const gatherTgt = { address: tgt_hex, amount: repeatMojo, symbol: net.symbol, memos: [] };
    const gatherPlan = transfer.generateSpendPlan(gatherCoins, [gatherTgt], change_hex, 0n, net.symbol);

    const gatherBundle = await transfer.generateSpendBundleWithoutCat(gatherPlan, observers, [], net);

    ubundle = combineSpendBundle(transferBundle, gatherBundle);
  }

  return { repeatMojo: Number(repeatMojo), bundle: ubundle };
}
