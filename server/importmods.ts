import { readdirSync, readFileSync, writeFileSync } from 'fs';
import puzzle from '../src/services/crypto/puzzle';
import { Instance } from "../src/services/util/instance";

const dirname = "../../ref/chia-blockchain/chia/wallet/puzzles/"
const suffix = ".clvm.hex";
const progdata: { [name: string]: string } = {};
const hexdata: { [name: string]: string } = {};

Instance.init().then(async () => {
  const filenames = readdirSync(dirname);
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    if (!filename.endsWith(suffix)) continue;
    const content = readFileSync(dirname + filename, 'utf-8');
    if (content.indexOf("unknown operator") >= 0) continue;

    try {
      const hex = content.trim();
      const d = await puzzle.disassemblePuzzle(hex);
      const key = filename.slice(0, filename.length - suffix.length);
      progdata[key] = d;
      hexdata[key] = hex;
    }
    catch (err) {
      console.warn(`File ${filename} cannot be parsed!`);
    }
  };

  const content = `export const importModsProg: { [name: string]: string} = ${JSON.stringify(progdata, null, 2)};

export const importModsHex: { [name: string]: string} = ${JSON.stringify(hexdata, null, 2)};
  `;
  writeFileSync("../src/services/coin/imports.ts", content)
});