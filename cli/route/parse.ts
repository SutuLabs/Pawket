import express from "express";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import {
  analyzeCoin,
  convertUncurriedPuzzle,
  getModsPath,
  parseBlock,
  parseCoin,
  sexpAssemble,
  simplifyPuzzle,
  uncurryPuzzle,
} from "../../lib-chia/services/coin/analyzer";
import { Hex0x } from "../../lib-chia/services/coin/condition";
import puzzle from "../../lib-chia/services/crypto/puzzle";

interface ParseBlockRequest {
  ref_list?: string[];
  generator: string;
}

interface ParsePuzzleRequest {
  puzzle: string;
}

interface AnalyzeTxRequest {
  coin_name: string;
  puzzle: string;
  solution: string;
  amount: number;
  coin_parent: string;
  puzzle_hash: string;
}

export async function parseBlockFunc(req: express.Request, res: express.Response): Promise<void> {
  try {
    if (process.env.SHOW_LOG) {
      console.time("parse_block");
    }
    const r = req.body as ParseBlockRequest;
    const bg = await parseBlock(r.generator, r.ref_list);
    const prog = sexpAssemble(bg);
    const argarr = await Promise.all(Array.from(prog.first().as_iter()).map(async (_) => await parseCoin(_)));

    if (process.env.SHOW_LOG) {
      console.log(`generated ${argarr.length} coins`);
    }
    // res.send(JSON.stringify(argarr, null, 4))
    res.send(JSON.stringify(argarr));
  } catch (err) {
    console.warn(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }));
  } finally {
    if (process.env.SHOW_LOG) {
      console.timeEnd("parse_block");
    }
  }
}

export async function parsePuzzleFunc(req: express.Request, res: express.Response): Promise<void> {
  try {
    const r = req.body as ParsePuzzleRequest;
    const puz = await puzzle.disassemblePuzzle(r.puzzle);
    const decPuzzle = await simplifyPuzzle(assemble(puz));
    res.send(JSON.stringify(decPuzzle));
  } catch (err) {
    console.warn(err);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }));
  }
}

export async function parseTxFunc(req: express.Request, res: express.Response): Promise<void> {
  let r: AnalyzeTxRequest | null = null;
  try {
    r = req.body as AnalyzeTxRequest;
    // console.log(`${JSON.stringify(r)},`);
    const coin = { amount: BigInt(r.amount), parent_coin_info: r.coin_parent as Hex0x, puzzle_hash: r.puzzle_hash as Hex0x };

    const uncPuzzle = await uncurryPuzzle(sexpAssemble(r.puzzle), r.puzzle);
    const decPuzzle = convertUncurriedPuzzle(uncPuzzle);
    const mods = getModsPath(decPuzzle);
    const analysis = await analyzeCoin(mods, uncPuzzle, coin, r.solution);

    res.send(
      JSON.stringify({
        coin_name: r.coin_name,
        parsed_puzzle: decPuzzle,
        mods,
        analysis: analysis,
      })
    );
  } catch (err) {
    console.warn(err);
    if (r) console.log(`${JSON.stringify(r)},`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }));
  }
}
