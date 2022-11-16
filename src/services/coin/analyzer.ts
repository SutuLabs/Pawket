import 'dotenv/config'
import { disassemble } from "clvm_tools/clvm_tools/binutils";
import { SExp, Tuple, to_sexp_f, sexp_from_stream, Stream, Bytes } from "clvm";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { ModName, modshex, modshexdict } from "./mods";
import { getCoinName0x } from './coinUtility';
import { Hex0x, prefix0x, unprefix0x } from './condition';
import { sha256tree } from 'clvm_tools';
import puzzle from '../crypto/puzzle';
import { analyzeCatCoin } from './cat';
import { analyzeDidCoin } from './did';
import { analyzeNftCoin } from './nft';
import { OriginCoin } from '../spendbundle';

export interface SimplePuzzle {
  mod: ModName,
  args: (CannotUncurryArgument | SimplePuzzle)[],
}

export interface CannotUncurryArgument {
  raw: string,
}

export interface CannotParsePuzzle {
  raw: string,
}

export interface UncurriedPuzzle {
  mod: ModName,
  hex: string,
  sexp: SExp,
  args: (CannotUncurryArgument | UncurriedPuzzle)[],
}

export interface CoinInfo {
  parent: Hex0x;
  puzzle: string;
  parsed_puzzle: SimplePuzzle | CannotParsePuzzle;
  amount: string;
  solution: string;
  coin_name: Hex0x;
  mods: string;
  key_param?: string;
  analysis?: string;
}

export async function simplifyPuzzle(
  origin: SExp,
  puz_hex: string | undefined = undefined
): Promise<SimplePuzzle | CannotParsePuzzle> {
  return convertUncurriedPuzzle(await uncurryPuzzle(origin, puz_hex));
}

export function convertUncurriedPuzzle(
  origin: UncurriedPuzzle | CannotParsePuzzle
): SimplePuzzle | CannotParsePuzzle {
  return "raw" in origin
    ? { raw: origin.raw }
    : { mod: origin.mod, args: origin.args.map(convertUncurriedPuzzle) };
}

export async function uncurryPuzzle(
  origin: SExp,
  puz_hex: string | undefined = undefined
): Promise<UncurriedPuzzle | CannotParsePuzzle> {
  try {
    if (!puz_hex) puz_hex = origin.as_bin().hex();
    puz_hex = unprefix0x(puz_hex);
    const puremodname = modshexdict[puz_hex];
    if (puremodname) return { mod: puremodname, args: [], hex: puz_hex, sexp: origin };

    const [mod, args] = uncurry(origin) as Tuple<SExp, SExp>;
    const argarr: SExp[] = !args ? [] : Array.from(args.as_iter());
    const simpargs = (await Promise.all(argarr.map(_ => uncurryPuzzle(_))))
      .map((_: (UncurriedPuzzle | CannotParsePuzzle)) => "raw" in _ ? { raw: _.raw } : _);
    const mod_hex: string = mod.as_bin().hex();
    const modname = modshexdict[mod_hex];
    if (!modname) return { raw: prefix0x(puz_hex) };

    return { mod: modname, args: simpargs, hex: puz_hex, sexp: origin };
  } catch (err) {
    return { raw: puz_hex ? prefix0x(puz_hex) : "" };
  }
}

export async function parseCoin(all: SExp): Promise<CoinInfo> {
  const parent = prefix0x(disassemble(all.first()));
  let next = all.rest();
  const puz = next.first();
  const puz_hex = prefix0x(puz.as_bin().hex());
  next = next.rest();
  const amount = next.first().as_bigint();
  next = next.rest();
  const solution = prefix0x(next.first().as_bin().hex());

  const puzzle_hash = prefix0x(sha256tree(puz).hex());
  const coin: OriginCoin = { amount, parent_coin_info: parent, puzzle_hash };
  const coin_name = getCoinName0x(coin);

  const uncPuzzle = await uncurryPuzzle(puz, puz_hex);
  const decPuzzle = convertUncurriedPuzzle(uncPuzzle);
  const mods = getModsPath(decPuzzle);
  const key_param = getKeyParam(decPuzzle)
  const analysis = await analyzeCoin(mods, uncPuzzle, coin, solution);

  return {
    parent,
    puzzle: puz_hex,
    parsed_puzzle: decPuzzle,
    amount: amount.toString(),
    solution,
    coin_name,
    mods,
    key_param,
    analysis,
  };
}

export async function analyzeCoin(
  mods: string,
  uncPuzzle: UncurriedPuzzle | CannotParsePuzzle,
  coin: OriginCoin,
  solution_hex: string,
): Promise<string | undefined> {
  const analysis = mods.startsWith("cat_v1(") ? await analyzeCatCoin(uncPuzzle)
    : mods.startsWith("cat_v2(") ? await analyzeCatCoin(uncPuzzle)
      : mods.startsWith("singleton_top_layer_v1_1(did_innerpuz(")
        ? await analyzeDidCoin(uncPuzzle, undefined, coin, solution_hex)
        : mods.startsWith("singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),")
          ? await analyzeNftCoin(uncPuzzle, undefined, coin, solution_hex)
          : undefined;

  return analysis ? JSON.stringify(analysis) : undefined;
}

export async function parseBlock(generator_hex: string, ref_hex_list: string[] | undefined): Promise<string> {
  const getArgs = function (ref_list: string[]): SExp {
    return SExp.to([sexpAssemble(generator_hex), [ref_list.map(_ => Bytes.from(unprefix0x(_), "hex"))]]);
  };

  const bg = ref_hex_list?.length ?? 0 > 0
    ? await puzzle.calcPuzzleResult(modshex["generator"], getArgs(ref_hex_list ?? []).as_bin().hex(), "--hex", "--dump")
    : await puzzle.calcPuzzleResult(generator_hex, "ff8080", "--hex", "--dump"); // ff8080 == "(())"

  return bg;
}

export function getModsPath(parsed_puzzle: SimplePuzzle | CannotParsePuzzle): string {
  if ("raw" in parsed_puzzle) return "";
  return `${parsed_puzzle.mod}(${parsed_puzzle.args.map(_ => getModsPath(_)).filter(_ => _).join(",")})`;
}

function getKeyParam(parsed_puzzle: SimplePuzzle | CannotParsePuzzle): string | undefined {
  if ("raw" in parsed_puzzle) return undefined;
  if (parsed_puzzle.mod == "cat_v1" || parsed_puzzle.mod == "cat_v2") {
    const tail = parsed_puzzle.args[1];
    if ("raw" in tail) return tail.raw;
  }

  if (parsed_puzzle.mod == "singleton_top_layer_v1_1") {
    const inner_puzzle = parsed_puzzle.args[1];
    if ("raw" in inner_puzzle) return undefined;
    if (inner_puzzle.mod == "nft_state_layer") {
      const nft_inner_puzzle = inner_puzzle.args[3];
      if ("raw" in nft_inner_puzzle) return undefined;
      if (nft_inner_puzzle.mod == "nft_ownership_layer") {
        const nft_transfer_puzzle = nft_inner_puzzle.args[2];
        if ("raw" in nft_transfer_puzzle) return undefined;
        if (nft_transfer_puzzle.mod == "nft_ownership_transfer_program_one_way_claim_with_royalties") {
          const royaltyAddress = nft_transfer_puzzle.args[1];
          if ("raw" in royaltyAddress) return royaltyAddress.raw;
        }
      }
    }
    else if (inner_puzzle.mod == "did_innerpuz") {
      const recovery = inner_puzzle.args[1];
      if ("raw" in recovery) return recovery.raw;
    }
  }

  return undefined;
}

export const sexpAssemble = function (hexString: string): SExp {
  const bts = Bytes.from(unprefix0x(hexString), "hex")
  const input_sexp = sexp_from_stream(new Stream(bts as Bytes), to_sexp_f);
  return input_sexp;
};

export const expectModArgs = function (puz: SimplePuzzle, mods: (ModName | ModName[]), argLength: number): boolean {
  if (!Array.isArray(mods)) mods = [mods];
  return mods.some((mod: ModName) => puz.mod == mod) && puz.args.length == argLength;
};