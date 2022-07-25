import 'dotenv/config'
import express from 'express'
import puzzle from "../src/services/crypto/puzzle";
import { Instance } from "../src/services/util/instance";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import { parseCoin, simplifyPuzzle } from "../src/services/coin/analyzer";
import { modsprog } from "../src/services/coin/mods";
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

  Instance.init().then(() => {
    app.post('/parse_block', async (req: express.Request, res: express.Response) => {
      try {
        console.time("parse_block");
        const r = req.body as ParseBlockRequest;

        const getArg = function (ref: string): string { return "(" + prefix0x(ref) + ")"; };
        const getArgs = async function (ref_list: string[]): Promise<string> {
          return "(" + [await puzzle.disassemblePuzzle(r.generator), "(" + ref_list.map(_ => getArg(_)).join(" ") + ")"].join(" ") + ")";
        };
        // console.time("brun");
        const bg = r.ref_list?.length ?? 0 > 0
          ? await puzzle.calcPuzzleResult(modsprog["generator"], await getArgs(r.ref_list ?? []))
          : await puzzle.calcPuzzleResult(r.generator, "ff8080", "--hex"); // ff8080 == "(())"
        // console.timeEnd("brun");
        // console.time("assemble");
        const prog = assemble(bg);
        // console.timeEnd("assemble");
        // console.time("parse_coin");
        const argarr = await Promise.all(Array.from(prog.first().as_iter())
          .map(async _ => await parseCoin(_)));
        // console.timeEnd("parse_coin");
        console.log(`generated ${argarr.length} coins`);
        res.send(JSON.stringify(argarr))
      }
      catch (err) {
        console.warn(err);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
      }
      finally {
        console.timeEnd("parse_block");
      }
    })

    app.post('/parse_puzzle', async (req: express.Request, res: express.Response) => {
      try {
        const r = req.body as ParsePuzzleRequest;
        const puz = await puzzle.disassemblePuzzle(r.puzzle);
        const decPuzzle = await simplifyPuzzle(assemble(puz));
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