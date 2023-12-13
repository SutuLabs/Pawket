import { getFirstLevelArgMsg, getNumber, Hex0x, prefix0x, unprefix0x } from "./condition";
import { CannotParsePuzzle, UncurriedPuzzle } from "./analyzer";
import puzzle, { ConditionArgs, ExecuteResult } from "../crypto/puzzle";
import { ConditionOpcode } from "./opcode";
import { OriginCoin } from "../spendbundle";
import { getCoinName0x } from "./coinUtility";
import { hex2ascSingle } from "./singleton";
import { sha256 } from "../offer/bundler";

export interface P2CoinInfo {
  coinId: Hex0x;
  from: Hex0x;
  to: Hex0x;
  parent: Hex0x;
}
export interface P2CoinWithMemo extends P2CoinInfo {
  memos: string[];
}

export interface P2InscriptionCoin extends P2CoinInfo {
  raw: string;
  meta?: InscriptionEntity;
}

export interface InscriptionEntity {
  p: "xchs";
  op: "mint" | "transfer" | "deploy";
  tick: string;
  amt?: number;
  lim?: number;
  max?: number;
}
export interface InscriptionParseEntity {
  p?: string;
  op?: string;
  tick?: string;
  amt?: string;
  lim?: string;
  max?: string;
}

export interface P2InscriptionCoinAnalysisResult {
  coins: P2InscriptionCoin[];
}

export async function analyzeP2Coin(
  puz: string | (UncurriedPuzzle | CannotParsePuzzle),
  solution_hex: string,
  coin: OriginCoin
): Promise<P2InscriptionCoinAnalysisResult | null> {
  const puz_hex = typeof puz === "string" ? puz : "hex" in puz ? puz.hex : undefined;
  if (!puz_hex) return null;

  const cms = (await getCoinMemos(puz_hex, solution_hex, getCoinName0x(coin), coin.puzzle_hash)) ?? [];
  const coins = await convertToInscriptionCoins(cms);

  if (coins.length == 0) return null;
  return { coins };
}

export async function getCoinMemos(
  puzzle_hex: string,
  solution_hex: string,
  thisCoinName: Hex0x,
  thisPuzzleHash: Hex0x
): Promise<P2CoinWithMemo[] | undefined> {
  let result: ExecuteResult;
  try {
    result = await puzzle.executePuzzleHex(puzzle_hex, solution_hex);
  } catch (err) {
    return undefined; // when puzzle is settlement hint in offer, it is invalid to execute, just ignore
  }

  const ret: P2CoinWithMemo[] = [];

  try {
    const coins = result.conditions.filter((_) => _.code == ConditionOpcode.CREATE_COIN); // && getNumber(getFirstLevelArgMsg(_.args.at(1)) ?? "0") % 2n == 1n)
    if (coins.length == 0) return [];
    for (let i = 0; i < coins.length; i++) {
      const coin = coins[i];

      let memos: string[];
      const thirdArg = coin.args.at(2);
      if (!thirdArg) memos = [];
      else if (thirdArg.constructor === Uint8Array) memos = [getFirstLevelArgMsg(thirdArg)];
      else {
        const typedThirdArg: ConditionArgs[] = thirdArg as ConditionArgs[];
        memos = typedThirdArg.map((_: ConditionArgs) => getFirstLevelArgMsg(_));
        memos[1] = hex2ascSingle(unprefix0x(memos[1])) ?? "";
      }
      const nextcoin_puzhash = prefix0x(getFirstLevelArgMsg(coin.args.at(0)) ?? "()");
      const amount = getNumber(getFirstLevelArgMsg(coin.args.at(1)) ?? "0");
      const nextCoinName = getCoinName0x({ parent_coin_info: thisCoinName, amount, puzzle_hash: nextcoin_puzhash });
      ret.push({ coinId: nextCoinName, memos, from: thisPuzzleHash, to: nextcoin_puzhash, parent: thisCoinName });
    }

    return ret;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("failed to get coin memo: " + err);
    }

    return ret;
  }
}

export async function convertToInscriptionCoins(coins: P2CoinWithMemo[]): Promise<P2InscriptionCoin[]> {
  const result: P2InscriptionCoin[] = [];

  function getXchsMeta(obj: InscriptionParseEntity): InscriptionEntity | undefined {
    if (obj.p != "xchs") return undefined;
    if (obj.tick?.length != 4) return undefined;
    if (obj.op != "mint" && obj.op != "transfer" && obj.op != "deploy") return undefined;
    const p = obj.p;
    const op = obj.op;
    const tick = obj.tick;
    const amt = parseInt(obj.amt ?? "");
    if ((obj.op == "mint" || obj.op == "transfer") && isNaN(amt)) return undefined;
    const max = parseInt(obj.max ?? "");
    if (obj.op == "deploy" && isNaN(max)) return undefined;
    const lim = parseInt(obj.lim ?? "");
    if (obj.op == "deploy" && isNaN(lim)) return undefined;
    if (max > Number.MAX_SAFE_INTEGER) return undefined;
    if (lim > Number.MAX_SAFE_INTEGER) return undefined;

    if (obj.op == "mint" || obj.op == "transfer") return { p, op, tick, amt };
    else return { p, op, tick, max, lim };
  }

  for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    if (coin.memos.length != 2) continue;
    const hint = coin.memos[0];
    const raw = coin.memos[1];
    const json = raw.replaceAll("'", '"');
    let obj: InscriptionParseEntity;
    try {
      obj = JSON.parse(json) as InscriptionParseEntity;
    } catch {
      continue; // parsing failed then skip this coin
    }

    if (!obj.p) continue;
    if (!obj.tick) continue;
    const protocol = obj.p;
    const expectHint = prefix0x(sha256(Buffer.from(`{'p':'${protocol}','tick':'${obj.tick}'}`)));
    if (hint != expectHint) continue;
    const meta = getXchsMeta(obj);

    result.push({
      coinId: coin.coinId,
      to: coin.to,
      from: coin.from,
      parent: coin.parent,
      raw,
      meta,
    });
  }

  return result;
}
