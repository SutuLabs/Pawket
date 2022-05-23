import { CoinSpend, SpendBundle } from "@/models/wallet";
import { Bytes, SExp, Tuple } from "clvm";
import { prefix0x } from '@/services/coin/condition';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import puzzle from "../crypto/puzzle";
import { modsdict, modsprog } from '@/services/coin/mods';
import { uncurry } from 'clvm_tools/clvm_tools/curry';
import { ConditionOpcode } from "../coin/opcode";
import { TokenSpendPlan } from "../transfer/transfer";
import bigDecimal from "js-big-decimal";
import { xchSymbol } from "@/store/modules/network";

export async function getOfferSummary(bundle: SpendBundle): Promise<OfferSummary> {

  const ocs = getOfferedCoins(bundle);
  const rcs = getRequestedCoins(bundle);
  const requested: OfferEntity[] = [];
  const offered: OfferEntity[] = [];

  const tryGetAssetId = async (puzzle_reveal: string): Promise<string> => {
    const { module, args } = await internalUncurry(puzzle_reveal);
    if (modsdict[module] == "cat") {
      const assetId = args[1];
      return assetId;
    }

    return "";
  }

  const getCoinEntities = async (coin: CoinSpend, type: "offer" | "request") => {
    const entities: OfferEntity[] = [];
    const puzzle_reveal = await puzzle.disassemblePuzzle(coin.puzzle_reveal);
    const solution = await puzzle.disassemblePuzzle(coin.solution);
    let result = "";
    let assetId = "";
    if (type == "request") {
      if (modsdict[puzzle_reveal] == "settlement_payments") {
        result = await puzzle.calcPuzzleResult(modsprog["settlement_payments"], solution);
      }
      else {
        assetId = await tryGetAssetId(puzzle_reveal);
        result = await puzzle.calcPuzzleResult(modsprog["settlement_payments"], solution);
      }
    } else if (type == "offer") {
      result = await puzzle.calcPuzzleResult(puzzle_reveal, solution);
      assetId = await tryGetAssetId(puzzle_reveal);
    }
    else {
      throw "not implement"
    }

    const conds = puzzle.parseConditions(result);
    for (let j = 0; j < conds.length; j++) {
      const cond = conds[j];
      if (cond.code == ConditionOpcode.CREATE_COIN) {
        const tgt = prefix0x(Bytes.from(((cond.args[2] && cond.args[2]?.length > 0) ? cond.args[2][0] : cond.args[0]) as Uint8Array).hex());
        const cattgt = assetId ? prefix0x(Bytes.from(cond.args[0] as Uint8Array).hex()) : undefined;
        entities.push({
          id: assetId,
          amount: BigInt(prefix0x(Bytes.from(cond.args[1] as Uint8Array).hex())),
          target: tgt,
          cat_target: cattgt == tgt ? undefined : cattgt,
        })
      }
    }

    return entities;
  }

  for (let i = 0; i < ocs.length; i++) {
    const coin = ocs[i];
    offered.push(...(await getCoinEntities(coin, "offer")).filter(_ => _.target == "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79"));
  }

  for (let i = 0; i < rcs.length; i++) {
    const coin = rcs[i];
    requested.push(...await getCoinEntities(coin, "request"));
  }

  return { requested, offered };
}

export async function internalUncurry(puz: string): Promise<UncurriedPuzzle> {
  const curried = assemble(puz);
  const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
  const mods = disassemble(mod);
  const argarr = Array.from(args.as_iter()).map(_ => disassemble(_ as SExp));
  return { module: mods, args: argarr };
}

const EmptyParent = "0x0000000000000000000000000000000000000000000000000000000000000000";

function getOfferedCoins(bundle: SpendBundle): CoinSpend[] {
  return bundle.coin_spends.filter(_ => _.coin.parent_coin_info != EmptyParent)
}
function getRequestedCoins(bundle: SpendBundle): CoinSpend[] {
  return bundle.coin_spends.filter(_ => _.coin.parent_coin_info == EmptyParent)
}

export function getOfferEntities(ents: OfferTokenAmount[], target: string, catIds: { [name: string]: string }): OfferEntity[] {
  return ents.map((_) => ({
    id: _.token == xchSymbol() ? "" : catIds[_.token],
    symbol: _.token,
    amount: getAmount(_.token, _.amount),
    target: target,
  }));
}

function getAmount(symbol: string, amount: string): bigint {
  const decimal = symbol == xchSymbol() ? 12 : 3;
  return BigInt(bigDecimal.multiply(amount, Math.pow(10, decimal)));
}

export interface UncurriedPuzzle {
  module: string;
  args: string[];
}

export interface OfferEntity {
  symbol?: string;
  id: string;
  amount: bigint;
  target: string;
  cat_target?: string;
}

export interface OfferPlan {
  id: string;
  plan: TokenSpendPlan;
}

export interface OfferSummary {
  requested: OfferEntity[];
  offered: OfferEntity[];
}

export interface OfferTokenAmount {
  token: string;
  amount: string;
}

