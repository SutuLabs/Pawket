import puzzle, { ExecuteResult, PlaintextPuzzle, PuzzleObserver } from "../crypto/puzzle";
import { TokenPuzzleObserver } from "../crypto/receive";
import { curryMod } from "../offer/bundler";
import { getFirstLevelArgMsg, getNumber, Hex0x, prefix0x } from "./condition";
import { modshash, modsprog } from "./mods";
import { Bytes, SExp, Tuple } from "clvm";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import { ConditionOpcode } from "./opcode";
import { getCoinName0x } from "./coinUtility";

export type SingletonStructList = [Bytes, [Bytes, Bytes]];

export type ParsedMetadata = { [name: string]: string | string[] | undefined };

export async function constructSingletonTopLayerPuzzle(
  launcherId: string,
  launcherPuzzleHash: string,
  inner_state_puzzle: string
): Promise<PlaintextPuzzle> {
  const sgnStruct = `(${prefix0x(modshash["singleton_top_layer_v1_1"])} ${prefix0x(launcherId)} . ${prefix0x(launcherPuzzleHash)})`;
  const curried_tail = await curryMod(modsprog["singleton_top_layer_v1_1"], sgnStruct, inner_state_puzzle);
  if (!curried_tail) throw new Error("failed to curry tail. the inner_state_puzzle = " + inner_state_puzzle);

  return curried_tail;
}

export function getPuzzleDetail(
  tgt_hex: string,
  requests: TokenPuzzleObserver[]
): PuzzleObserver {

  const puzzleDict: { [key: string]: PuzzleObserver } = Object.assign({}, ...requests.flatMap((_) => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x })));
  const getPuzDetail = (hash: string) => {
    const puz = puzzleDict[hash];
    if (!puz) throw new Error(`cannot find puzzle: (${hash}) in (${requests.flatMap(_ => _.puzzles).map(_ => _.hash).join(", ")})`);
    return puz;
  };

  const inner_p2_puzzle = getPuzDetail(tgt_hex);
  return inner_p2_puzzle;
}

export function parseMetadata(
  rawmeta: string | SExp,
): ParsedMetadata {
  const metaprog = typeof rawmeta === "string" ? assemble(rawmeta) : rawmeta;
  const metalist = (metaprog.as_javascript() as (Bytes[] | [Bytes, Bytes[]] | [Bytes, Tuple<Bytes, Bytes>])[])
    .map(_ => Array.from(_))
    .map(_ => _.flatMap(it =>
      (it instanceof Tuple) ? [it.at(0).hex(), it.at(1).hex()]
        : Array.isArray(it) ? it.map(a => a.hex())
          : it.hex()));

  const parsed: ParsedMetadata = {};
  for (let i = 0; i < metalist.length; i++) {
    const meta = metalist[i];
    if (meta.length == 0) throw new Error(`Face abnormal metalist: ` + JSON.stringify(metalist));
    else if (meta.length > 2) parsed[meta[0]] = meta.slice(1);
    else parsed[meta[0]] = meta[1];

  }

  return parsed;
}

export function hex2asc(hex: string | string[] | undefined): string | string[] | undefined {
  if (!hex) return hex;
  if (typeof hex === "string") return Buffer.from(hex, "hex").toString();
  return hex.map(_ => Buffer.from(_, "hex").toString());
}

export function hex2ascSingle(hex: string | string[] | undefined): string | undefined {
  const result = hex2asc(hex);
  if (!result || typeof result === "string") return result;
  return result[0];
}

export function hex2dec(hex: string | string[] | undefined): string | string[] | undefined {
  if (!hex) return hex;
  if (typeof hex === "string") return parseInt(prefix0x(hex)).toString();
  return hex.map(_ => parseInt(prefix0x(_)).toString());
}

export function hex2decSingle(hex: string | string[] | undefined): string | undefined {
  const result = hex2dec(hex);
  if (!result || typeof result === "string") return result;
  return result[0];
}

export async function getNextCoinName0x(puzzle_hex: string, solution_hex: string, thisCoinName: Hex0x): Promise<string | undefined> {
  let result: ExecuteResult;
  try {
    result = await puzzle.executePuzzleHex(puzzle_hex, solution_hex);
  } catch (err) {
    return undefined; // when puzzle is settlement hint in offer, it is invalid to execute, just ignore
  }

  try {
    const coinCond = result.conditions
      .filter((_) => _.code == ConditionOpcode.CREATE_COIN && getNumber(getFirstLevelArgMsg(_.args.at(1)) ?? "0") % 2n == 1n).at(0);
    if (!coinCond) return undefined;
    const nextcoin_puzhash = prefix0x(getFirstLevelArgMsg(coinCond.args.at(0)) ?? "()");
    const amount = getNumber(getFirstLevelArgMsg(coinCond.args.at(1)) ?? "0");
    const nextCoinName = getCoinName0x({ parent_coin_info: thisCoinName, amount, puzzle_hash: nextcoin_puzhash });
    return nextCoinName;
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error("failed to get next coin name: " + err);
    }
  }
}