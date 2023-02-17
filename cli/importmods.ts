import { readdirSync, readFileSync, writeFileSync } from 'fs';
import puzzle from '../src/services/crypto/puzzle';
import { Instance } from "../src/services/util/instance";
import { sha256tree } from 'clvm_tools';
import { sexpAssemble } from '../src/services/coin/analyzer';

const suffix = ".clvm.hex";

const nameMappings: { [key: string]: string } = {
  settlement_payments: "settlement_payments_v1",
  settlement_payments_old: "settlement_payments",
};

Instance.init().then(async () => {
  const writeTypeFile = async function (dirname: string, typename: string) {
    const progdata: { [name: string]: string } = {};
    const hexdata: { [name: string]: string } = {};
    const sha256data: { [name: string]: string } = {};
    const names: string[] = [];
    const camelName = typename.charAt(0).toLowerCase() + typename.slice(1);

    const filenames = readdirSync(dirname);
    for (let i = 0; i < filenames.length; i++) {
      const filename = filenames[i];
      if (!filename.endsWith(suffix)) continue;
      const content = readFileSync(dirname + filename, 'utf-8');
      if (content.indexOf("unknown operator") >= 0) continue;

      try {
        const hex = content.trim();
        const d = await puzzle.disassemblePuzzle(hex);
        const originKey = filename.slice(0, filename.length - suffix.length);
        const key = nameMappings[originKey] || originKey;
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

    const content = `export type ${typename}Name = ${names.map(_ => `"${_}"`).join(" | ")};

export const ${camelName}sProg: { [name in ${typename}Name]: string } = ${JSON.stringify(progdata, null, 2)};

export const ${camelName}sHex: { [name in ${typename}Name]: string } = ${JSON.stringify(hexdata, null, 2)};

export const ${camelName}sHash: { [name in ${typename}Name]: string } = ${JSON.stringify(sha256data, null, 2)};
`;
    writeFileSync(`../src/services/coin/${camelName}s.ts`, content);
  };

  await writeTypeFile("../../ref/chia-blockchain/chia/wallet/puzzles/", "ImportMod");
  await writeTypeFile("clvm/", "OtherMod");
});