import { readdirSync, readFileSync, writeFileSync } from 'fs';
import puzzle from '../src/services/crypto/puzzle';
import { Instance } from "../src/services/util/instance";
import { SExp } from "clvm";
import { sha256tree } from 'clvm_tools';
import { sexpAssemble } from '../src/services/coin/analyzer';

const dirname = "../../ref/chia-blockchain/chia/wallet/puzzles/"
const suffix = ".clvm.hex";
const progdata: { [name: string]: string } = {};
const hexdata: { [name: string]: string } = {};
const sha256data: { [name: string]: string } = {};
const names: string[] = [];

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
      const prog = sexpAssemble(hex);
      const hash = sha256tree(prog).hex();
      sha256data[key] = hash;
      names.push(key);
    }
    catch (err) {
      console.warn(`File ${filename} cannot be parsed!`);
    }
  };

  const content = `export type ImportModName = ${names.map(_ => `"${_}"`).join(" | ")};

export const importModsProg: { [name in ImportModName]: string} = ${JSON.stringify(progdata, null, 2)};

export const importModsHex: { [name in ImportModName]: string} = ${JSON.stringify(hexdata, null, 2)};

export const importModsHash: { [name in ImportModName]: string} = ${JSON.stringify(sha256data, null, 2)};
`;
  writeFileSync("../src/services/coin/importMods.ts", content)
});