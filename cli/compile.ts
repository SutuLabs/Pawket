import { readdirSync, readFileSync, writeFileSync } from 'fs';
import puzzle from '../src/services/crypto/puzzle';
import { Instance } from "../src/services/util/instance";
import { sha256tree } from 'clvm_tools';
import { sexpAssemble } from '../src/services/coin/analyzer';

const suffix = ".clvm";

Instance.init().then(async () => {
  const compile = async function (dirname: string) {
    const filenames = readdirSync(dirname);
    for (let i = 0; i < filenames.length; i++) {
      const filename = filenames[i];
      if (!filename.endsWith(suffix)) continue;
      const content = readFileSync(dirname + filename, 'utf-8');
      if (content.indexOf("unknown operator") >= 0) continue;

      try {
        const prog = content.trim();
        const compiled = await puzzle.compileRun(prog);
        const hex = await puzzle.encodePuzzle(compiled);
        const sexp = sexpAssemble(hex);
        const hash = sha256tree(sexp).hex();

        writeFileSync(dirname + filename + ".hex", hex);
        writeFileSync(dirname + filename + ".hex.sha256tree", hash);
      }
      catch (err) {
        console.warn(`File ${filename} cannot be parsed! err:`, err);
      }
    };
  };

  await compile("clvm/");
});