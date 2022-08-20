import { PuzzleDetail } from "../crypto/puzzle";
import { TokenPuzzleDetail } from "../crypto/receive";
import { curryMod } from "../offer/bundler";
import { prefix0x, unprefix0x } from "./condition";
import { modshash, modsprog } from "./mods";
import { Bytes, SExp } from "clvm";
import { assemble } from "clvm_tools/clvm_tools/binutils";

export type SingletonStructList = [Bytes, [Bytes, Bytes]];

export type ParsedMetadata = { [name: string]: string | string[] | undefined };

export async function constructSingletonTopLayerPuzzle(
  launcherId: string,
  launcherPuzzleHash: string,
  inner_state_puzzle: string
): Promise<string> {
  const sgnStruct = `(${prefix0x(modshash["singleton_top_layer_v1_1"])} ${prefix0x(launcherId)} . ${prefix0x(launcherPuzzleHash)})`;
  const curried_tail = await curryMod(modsprog["singleton_top_layer_v1_1"], sgnStruct, inner_state_puzzle);
  if (!curried_tail) throw new Error("failed to curry tail.");

  return curried_tail;
}

export function getPuzzleDetail(
  tgt_hex: string,
  requests: TokenPuzzleDetail[]
): PuzzleDetail {

  const puzzleDict: { [key: string]: PuzzleDetail } = Object.assign({}, ...requests.flatMap((_) => _.puzzles).map((x) => ({ [prefix0x(x.hash)]: x })));
  const getPuzDetail = (hash: string) => {
    const puz = puzzleDict[hash];
    if (!puz) throw new Error("cannot find puzzle");
    return puz;
  };

  const inner_p2_puzzle = getPuzDetail(tgt_hex);
  return inner_p2_puzzle;
}


export function cloneAndChangeRequestPuzzleTemporary(
  baseSymbol: string,
  requests: TokenPuzzleDetail[],
  originalHash: string,
  newPuzzle: string,
  newPuzzleHash: string,
): TokenPuzzleDetail[] {
  const extreqs = Array.from(requests.map((_) => ({ symbol: _.symbol, puzzles: Array.from(_.puzzles.map((_) => ({ ..._ }))) })));
  const nftReq = extreqs.find((_) => _.symbol == baseSymbol)?.puzzles.find((_) => unprefix0x(originalHash) == _.hash);
  if (!nftReq) throw new Error(`cannot find inner puzzle hash [${unprefix0x(originalHash)}] from ` + JSON.stringify(extreqs));
  nftReq.puzzle = newPuzzle;
  nftReq.hash = unprefix0x(newPuzzleHash);
  nftReq.address = "";
  return extreqs;
}

export function parseMetadata(
  rawmeta: string | SExp,
): ParsedMetadata {
  const metaprog = typeof rawmeta === "string" ? assemble(rawmeta) : rawmeta;
  const metalist: string[][] = (metaprog.as_javascript() as Bytes[][])
    .map(_ => Array.from(_))
    .map(_ => _.map(it => it.hex()));

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