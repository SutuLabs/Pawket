import { readFileSync, writeFileSync } from 'fs';
import puzzle from '../src/services/crypto/puzzle';
import { Instance } from "../src/services/util/instance";

const args = process.argv.slice(2);

Instance.init().then(async () => {
  const filename = args[0];
  const clvm = readFileSync(filename, 'utf-8');
  const compiled = await puzzle.compileRun(clvm);
  const hex = await puzzle.encodePuzzle(compiled);
  const hash = await puzzle.getPuzzleHashFromPuzzle(compiled);
  writeFileSync(filename + ".hex", hex);
  writeFileSync(filename + ".hex.sha256tree", hash);
});