import { readdirSync, readFileSync, writeFileSync } from 'fs';
import puzzle from '../src/services/crypto/puzzle';
import { Instance } from "../src/services/util/instance";

const dirname = "../../ref/chia-blockchain/chia/wallet/puzzles/"
const suffix = ".clvm.hex";
const data: { [name: string]: string } = {};

Instance.init().then(async () => {
  const filenames = readdirSync(dirname);
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    if (!filename.endsWith(suffix)) continue;
    const content = readFileSync(dirname + filename, 'utf-8');
    if (content.indexOf("unknown operator") >= 0) continue;

    try {
      const d = await puzzle.disassemblePuzzle(content.trim());
      data[filename.slice(0, filename.length - suffix.length)] = d;
    }
    catch (err) {
      console.warn(`File ${filename} cannot be parsed!`);
    }
  };

  writeFileSync("../src/services/coin/imports.ts", `export const importmods: { [name: string]: string} = ${JSON.stringify(data, null, 2)};`)
});