import 'dotenv/config'
import express from 'express'
import puzzle from "../src/services/crypto/puzzle";
import { Instance } from "../src/services/util/instance";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { SExp, Tuple } from "clvm";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { modsdict, modsprog } from "../src/services/coin/mods";
import { getCoinName0x } from "../src/services/coin/coinUtility";
import cluster from 'cluster'
import os from 'os'
import { prefix0x } from '../src/services/coin/condition';


// Check the number of available CPU.
let maxThreads = Number(process.env.MAX_THREAD ?? Number.MAX_SAFE_INTEGER);
maxThreads = maxThreads == 0 ? Number.MAX_SAFE_INTEGER : maxThreads;
const numCPUs = Math.min(os.cpus().length, maxThreads);

// For Master process
if (cluster.isPrimary && numCPUs > 1) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // This event is firs when worker died
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    ref_list?: string[],
    generator: string,
  }

  interface ParsePuzzleRequest {
    puzzle: string,
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
    args: (CannotUncurryArgument | SimplePuzzle)[],
  }

  interface CannotUncurryArgument {
    raw: string,
  }

  interface CannotParsePuzzle {
    raw: string,
  }

  const parseCoin = async function (info: string): Promise<CoinInfo> {
    const all = assemble(info);
    const parent = disassemble(all.first());
    const puz = disassemble(all.rest().first());
    const decPuzzle = await simplifyPuzzle(puz);
    const amount = disassemble(all.rest().rest().first());
    const solution_plain = disassemble(all.rest().rest().rest().first());
    const solution = prefix0x(await puzzle.encodePuzzle(solution_plain));
    const puzzle_hash = await puzzle.getPuzzleHashFromPuzzle(puz);
    const coinname = getCoinName0x({ parent_coin_info: parent, puzzle_hash, amount: BigInt(amount) });

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
        .map(_ => "raw" in _ ? { raw: _.raw } : _);
      const modname = modsdict[mods];
      if (!modname) return { raw: puz };

      return { mod: modname, args: simpargs };
    } catch (err) {
      return { raw: puz };
    }
  }

  Instance.init().then(() => {
    app.post('/parse_block', async (req: express.Request, res: express.Response) => {
      try {
        console.time("parse_block");
        const r = req.body as ParseBlockRequest;
        const blkgenpuz = await puzzle.disassemblePuzzle(r.generator);

        const getArg = function (ref: string): string { return "(" + prefix0x(ref) + ")"; };
        const getArgs = function (ref_list: string[]) { return "(" + [blkgenpuz, "(" + ref_list.map(_ => getArg(_)).join(" ") + ")"].join(" ") + ")"; };
        const bg = r.ref_list?.length ?? 0 > 0
          ? await puzzle.calcPuzzleResult(modsprog["generator"], getArgs(r.ref_list ?? []))
          : await puzzle.calcPuzzleResult(blkgenpuz, "(())");
        const prog = assemble(bg);
        const argarr = await Promise.all(Array.from(prog.first().as_iter())
          .map(_ => disassemble(_ as SExp))
          .map(async _ => await parseCoin(_)));
        console.timeEnd("parse_block");
        console.log(`generated ${argarr.length} coins`);
        res.send(JSON.stringify(argarr))
      }
      catch (err) {
        console.warn(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
      }
    })

    app.post('/parse_puzzle', async (req: express.Request, res: express.Response) => {
      try {
        const r = req.body as ParsePuzzleRequest;
        const puz = await puzzle.disassemblePuzzle(r.puzzle);
        const decPuzzle = await simplifyPuzzle(puz);
        res.send(JSON.stringify(decPuzzle))
      }
      catch (err) {
        console.warn(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
      }
    });
  });
}