import { skipFirstByte0x } from "./condition";
import { sha256tree } from "clvm_tools";
import { disassemble } from "clvm_tools/clvm_tools/binutils";
import { CannotParsePuzzle, expectModArgs, sexpAssemble, UncurriedPuzzle, uncurryPuzzle } from "./analyzer";

export interface CatCoinAnalysisResult {
  modHash: string;
  tailProgramHash: string;
  innerPuzzle: string;
  hintPuzzle: string;
}

export async function analyzeCatCoin(
  puz: string | (UncurriedPuzzle | CannotParsePuzzle),
): Promise<CatCoinAnalysisResult | null> {
  const parsed_puzzle = (typeof puz === "string")
    ? await uncurryPuzzle(sexpAssemble(puz))
    : puz;

  if ("raw" in parsed_puzzle) return null;

  if (!expectModArgs(parsed_puzzle, ["cat_v1", "cat_v2"], 3)) return null;

  const mod_hash_parsed = parsed_puzzle.args[0];
  const tail_program_hash_parsed = parsed_puzzle.args[1];
  const inner_puzzle_parsed = parsed_puzzle.args[2];

  if (!("raw" in mod_hash_parsed)
    || !("raw" in tail_program_hash_parsed)
  ) return null;

  const modHash = skipFirstByte0x(mod_hash_parsed.raw);
  const tailProgramHash = skipFirstByte0x(tail_program_hash_parsed.raw);
  const innerPuzzleSexp = sexpAssemble("raw" in inner_puzzle_parsed ? inner_puzzle_parsed.raw : inner_puzzle_parsed.hex);
  const innerPuzzle = disassemble(innerPuzzleSexp);
  const hintPuzzle = sha256tree(innerPuzzleSexp).hex();

  if (!modHash
    || !tailProgramHash
    || !innerPuzzle
    || !hintPuzzle
  ) return null;

  return {
    modHash,
    tailProgramHash,
    innerPuzzle,
    hintPuzzle,
  };
}