import { Bytes } from "clvm";
import { Hex0x, prefix0x } from "../coin/condition";
import { Instance } from "../util/instance";

export interface OriginCoin {
  amount: bigint;
  parent_coin_info: Hex0x;
  puzzle_hash: Hex0x;
}

export interface CoinSpend {
  coin: OriginCoin;
  puzzle_reveal: Hex0x;
  solution: Hex0x;
}

export interface SpendBundle {
  aggregated_signature: Hex0x;
  coin_spends: CoinSpend[];
}

export class UnsignedSpendBundle {
  public coin_spends: CoinSpend[];
  public type = "unsigned";

  constructor(coin_spends: CoinSpend[]) {
    this.coin_spends = coin_spends;
  }
}

export class PartialSpendBundle {
  public aggregated_signature: Hex0x;
  public coin_spends: CoinSpend[];
  public type = "partial";

  constructor(coin_spends: CoinSpend[], aggregated_signature: Hex0x) {
    this.coin_spends = coin_spends;
    this.aggregated_signature = aggregated_signature;
  }
}

export function combineSpendBundle(...spendbundles: (UnsignedSpendBundle | CoinSpend[] | undefined)[]): UnsignedSpendBundle;
export function combineSpendBundle(...spendbundles: (SpendBundle | UnsignedSpendBundle | CoinSpend[] | undefined)[]): PartialSpendBundle;
export function combineSpendBundle(...spendbundles: (PartialSpendBundle | UnsignedSpendBundle | CoinSpend[] | undefined)[]): PartialSpendBundle;
export function combineSpendBundle(
  ...spendbundles: (SpendBundle | PartialSpendBundle | UnsignedSpendBundle | CoinSpend[] | undefined)[]
): UnsignedSpendBundle | PartialSpendBundle | SpendBundle {

  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");

  const coin_spends = spendbundles
    .filter((_): _ is UnsignedSpendBundle | CoinSpend[] => !!_)
    .flatMap(_ => Array.isArray(_) ? _ : _.coin_spends);
  const sigs = spendbundles
    .map(_ => _ && "aggregated_signature" in _ && _.aggregated_signature)
    .filter((_): _ is Hex0x => !!_)
    .map(_ => BLS.G2Element.from_bytes(Bytes.from(_, "hex").raw()));
  if (sigs.length > 0) {
    const agg_sig = BLS.AugSchemeMPL.aggregate(sigs);
    const sig = Bytes.from(agg_sig.serialize()).hex();
    return {
      aggregated_signature: prefix0x(sig),
      coin_spends,
    };
  }

  return new UnsignedSpendBundle(coin_spends);
}