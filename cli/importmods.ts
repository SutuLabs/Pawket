import { readFileSync, writeFileSync } from "fs";
import puzzle from "../lib-chia/services/crypto/puzzle";
import { Instance } from "../lib-chia/services/util/instance";
import { sha256tree } from "clvm_tools";
import { sexpAssemble } from "../lib-chia/services/coin/analyzer";
import { Glob, GlobOptions } from "glob";

Instance.init().then(async () => {
  const writeTypeFile = async function (
    g: Glob<GlobOptions>,
    typename: string,
    suffix: string,
    nameMappings: Record<string, string> = {}
  ) {
    const progdata: { [name: string]: string } = {};
    const hexdata: { [name: string]: string } = {};
    const sha256data: { [name: string]: string } = {};
    const names: string[] = [];
    const camelName = typename.charAt(0).toLowerCase() + typename.slice(1);

    const filenames = Array.from(g).sort();
    for (const filename of filenames) {
      const fn = filename.toString();
      const content = readFileSync(fn, "utf-8");
      if (content.indexOf("unknown operator") >= 0) continue;

      try {
        const hex = content.trim();
        const d = await puzzle.disassemblePuzzle(hex);
        const originKey = getFilename(fn.slice(0, fn.length - suffix.length));
        const key = nameMappings[originKey] || originKey;
        progdata[key] = d;
        hexdata[key] = hex;
        const prog = sexpAssemble(hex);
        const hash = sha256tree(prog).hex();
        sha256data[key] = hash;
        names.push(key);
      } catch (err) {
        console.warn(`File ${filename} cannot be parsed!`);
      }
    }

    const content = `export type ${typename}Name = ${names.map((_) => `"${_}"`).join(" | ")};

export const ${camelName}sProg: { [name in ${typename}Name]: string } = ${JSON.stringify(progdata, null, 2)};

export const ${camelName}sHex: { [name in ${typename}Name]: string } = ${JSON.stringify(hexdata, null, 2)};

export const ${camelName}sHash: { [name in ${typename}Name]: string } = ${JSON.stringify(sha256data, null, 2)};
`;
    writeFileSync(`../lib-chia/services/coin/${camelName}s.ts`, content);
  };

  await writeTypeFile(new Glob("../../../ref/chia-blockchain/chia/wallet/puzzles/*.clvm.hex", {}), "ImportMod", ".clvm.hex", {
    settlement_payments: "settlement_payments_v1",
    settlement_payments_old: "settlement_payments",
  });
  await writeTypeFile(new Glob("../../../ref/tibet/clvm/*.clvm.hex", {}), "TibetMod", ".clvm.hex");
  await writeTypeFile(new Glob("clvm/*.clvm.hex", {}), "OtherMod", ".clvm.hex");
  await writeTypeFile(new Glob("../../../ref/internal-custody/cic/clsp/**/*.clsp.hex", {}), "InternalCustodyMod", ".clsp.hex");
  await writeTypeFile(
    new Glob("../../../ref/chia-clawback-primitive/src/clsp/**/*.clsp.hex", {}),
    "ClawbackPrimitiveMod",
    ".clsp.hex"
  );
});

function getFilename(fullPath: string) {
  // eslint-disable-next-line no-useless-escape
  return fullPath.replace(/^.*[\\\/]/, "");
}
