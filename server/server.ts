import 'dotenv/config'
import express from 'express'
import puzzle from "../src/services/crypto/puzzle";
import { Instance } from "../src/services/util/instance";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { SExp, Tuple } from "clvm";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { modsdict, modsprog } from "../src/services/coin/mods";
import { getCoinName } from "../src/services/coin/coinUtility";
import cluster from 'cluster'
import os from 'os'


// Check the number of available CPU.
const numCPUs = Math.min(os.cpus().length, Number(process.env.MAX_THREAD ?? 1));

// For Master process
if (cluster.isPrimary && numCPUs > 1) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // This event is firs when worker died
  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
}

// For Worker
else {

  const app: express.Express = express()
  app.use(express.json({ limit: '3mb' }))
  app.use(express.urlencoded({ extended: true }))

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "*")
    res.header("Access-Control-Allow-Headers", "*");
    next();
  })

  app.listen(process.env.PORT, () => {
    console.log(`Start on port ${process.env.PORT}.`)
  })

  interface ParseBlockRequest {
    ref_list: string[],
    generator: string,
  }

  interface CoinInfo {
    parent: string,
    puzzle: SimplePuzzle | CannotParsePuzzle,
    amount: string,
    solution: string,
    coinname: string,
  }

  interface SimplePuzzle {
    mod: string,
    args: (string | SimplePuzzle)[],
  }

  interface CannotParsePuzzle {
    puzzle: string,
  }

  const parseCoin = async function (info: string): Promise<CoinInfo> {
    const all = assemble(info);
    const parent = disassemble(all.first());
    const puz = disassemble(all.rest().first());
    const decPuzzle = await simplifyPuzzle(puz);
    const amount = disassemble(all.rest().rest().first());
    const solution = disassemble(all.rest().rest().rest().first());
    const puzzle_hash = await puzzle.getPuzzleHashFromPuzzle(puz);
    const coinname = getCoinName({ parent_coin_info: parent, puzzle_hash, amount: BigInt(amount) });

    return { parent, puzzle: decPuzzle, amount, solution, coinname };
  }

  const simplifyPuzzle = async function (puz: string): Promise<SimplePuzzle | CannotParsePuzzle> {

    try {
      const puremodname = modsdict[puz];
      if (puremodname) return { mod: puremodname, args: [] };

      const curried = assemble(puz);
      const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
      const mods = disassemble(mod);
      const argarr = !args ? [] : Array.from(args.as_iter()).map((_) => disassemble(_ as SExp));
      const simpargs = (await Promise.all(argarr.map(_ => simplifyPuzzle(_))))
        .map(_ => "puzzle" in _ ? _.puzzle : _);
      const modname = modsdict[mods];
      if (!modname) return { puzzle: puz };

      return { mod: modname, args: simpargs };
    } catch (err) {
      return { puzzle: puz };
    }
  }

  const chialisp_deserialisation = async function (input: string): Promise<string> {
    const result = await puzzle.calcPuzzleResult(modsprog["chialisp_deserialisation"], input);
    return result;
  }

  Instance.init().then(() => {
    app.post('/parse_block', async (req: express.Request, res: express.Response) => {
      try {

        const r = req.body as ParseBlockRequest;
        const blkgenpuz = await puzzle.disassemblePuzzle(r.generator);
        if (r?.ref_list.length > 0) {
          res.status(400).send(JSON.stringify({ success: false, error: `ref_list cannot be supported` }));
          return;
        }

        if (r?.ref_list.length > 1) {
          throw new Error(`abnormal ref_list with length ${r.ref_list.length}`);
        }
        const arg = r?.ref_list.length == 1
          ? await chialisp_deserialisation("(" + (await puzzle.disassemblePuzzle(r.ref_list[0])) + ")")
          : "()";

        const bg = await puzzle.calcPuzzleResult(blkgenpuz, `(${arg})`)
        const prog = assemble(bg);
        const argarr = await Promise.all(Array.from(prog.first().as_iter())
          .map(_ => disassemble(_ as SExp))
          .map(async _ => await parseCoin(_)));
        console.log(`generated ${argarr.length} coins`);
        res.send(JSON.stringify(argarr))
      }
      catch (err) {
        console.warn(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
      }
    })
  });
}