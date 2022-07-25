import 'dotenv/config'
import { disassemble } from "clvm_tools/clvm_tools/binutils";
import { SExp, Tuple } from "clvm";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { modsdict } from "./mods";
import puzzle from '../crypto/puzzle';
import { getCoinName0x } from './coinUtility';
import { prefix0x } from './condition';

export interface SimplePuzzle {
  mod: string,
  args: (CannotUncurryArgument | SimplePuzzle)[],
}

export interface CannotUncurryArgument {
  raw: string,
}

export interface CannotParsePuzzle {
  raw: string,
}

export interface CoinInfo {
  parent: string,
  puzzle: SimplePuzzle | CannotParsePuzzle,
  amount: string,
  solution: string,
  coinname: string,
}

export async function simplifyPuzzle(origin: SExp, puz: string | undefined = undefined): Promise<SimplePuzzle | CannotParsePuzzle> {
  try {
    if (!puz) puz = disassemble(origin);
    const puremodname = modsdict[puz];
    if (puremodname) return { mod: puremodname, args: [] };

    const [mod, args] = uncurry(origin) as Tuple<SExp, SExp>;
    const mods = disassemble(mod);
    const argarr: SExp[] = !args ? [] : Array.from(args.as_iter());
    const simpargs = (await Promise.all(argarr.map(_ => simplifyPuzzle(_))))
      .map(_ => "raw" in _ ? { raw: _.raw } : _);
    const modname = modsdict[mods];
    if (!modname) return { raw: puz };

    return { mod: modname, args: simpargs };
  } catch (err) {
    return { raw: puz ?? "" };
  }
}

export async function parseCoin(all: SExp): Promise<CoinInfo> {
  const parent = disassemble(all.first());
  let next = all.rest();
  const puz = next.first();
  const puz_str = disassemble(puz);
  const decPuzzle = await simplifyPuzzle(puz, puz_str);
  next = next.rest();
  const amount = disassemble(next.first());
  next = next.rest();
  const solution_plain = disassemble(next.first());
  const solution = prefix0x(await puzzle.encodePuzzle(solution_plain));
  const puzzle_hash = await puzzle.getPuzzleHashFromPuzzle(puz_str);
  const coinname = getCoinName0x({ parent_coin_info: parent, puzzle_hash, amount: BigInt(amount) });

  return { parent, puzzle: decPuzzle, amount, solution, coinname };
}