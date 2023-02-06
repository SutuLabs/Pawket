import 'dotenv/config'
import express from 'express'
import puzzle from "../src/services/crypto/puzzle";
import { Instance } from "../src/services/util/instance";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import { analyzeCoin, convertUncurriedPuzzle, getModsPath, parseBlock, parseCoin, sexpAssemble, simplifyPuzzle, uncurryPuzzle } from "../src/services/coin/analyzer";
import { Hex0x, prefix0x } from '../src/services/coin/condition';
import { encodeOffer } from "../src/services/offer/encoding";
import { generateMintCnsOffer } from "../src/services/offer/cns";
import { OriginCoin, signSpendBundle } from '../src/services/spendbundle';
import transfer, { SymbolCoins, TransferTarget, TransferTargetOrigin } from '../src/services/transfer/transfer';
import receive, { TokenPuzzleDetail } from '../src/services/crypto/receive';
import utility from '../src/services/crypto/utility';
import { NetworkContext } from '../src/services/coin/coinUtility';
import { getLineageProofPuzzle } from "../src/services/transfer/call";
import { CnsMetadataValues } from '../src/models/nft';
import { CustomCat } from '../src/models/account';
import { CoinItem } from '../src/models/wallet';
import fetch from 'cross-fetch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
global.fetch = fetch
const app: express.Express = express()
app.use(express.json({ limit: '3mb' }))
app.use(express.urlencoded({ extended: true }))

interface ParseBlockRequest {
  ref_list?: string[],
  generator: string,
}

interface ParsePuzzleRequest {
  puzzle: string,
}

interface AnalyzeTxRequest {
  coin_name: string;
  puzzle: string;
  solution: string;
  amount: number;
  coin_parent: string;
  puzzle_hash: string;
}

interface CnsOfferRequest {
  targetAddress: string;
  changeAddress: string;
  price: number;
  fee: number;
  metadata: CnsMetadataValues;
  coin: OriginCoin;
  privateKey: string;
  puzzleHash: string;
  puzzleText: string;
  royaltyAddress: string;
  royaltyPercentage: number;
  chainId: string;
  symbol: string;
  prefix: string;
  nonce?: string;//test only
  intermediateKey?: string;//test only
}

interface BatchSendRequest {
  senderAddress: string;
  privateKey: string;
  transferTarget: TransferTargetOrigin[];
  fee: number;
  chainId: string;
  symbol: string;
  prefix: string;
}

interface PuzzleRequest {
  method?: "ToAddress" | string;
  parameters?: string[];
}

Instance.init().then(() => {
  app.get('/version', async (_req: express.Request, res: express.Response) => {
    res.send(JSON.stringify({ version: "0.1" }))
  });

  app.post('/parse_block', async (req: express.Request, res: express.Response) => {
    try {
      if (process.env.SHOW_LOG) {
        console.time("parse_block");
      }
      const r = req.body as ParseBlockRequest;
      const bg = await parseBlock(r.generator, r.ref_list);
      const prog = sexpAssemble(bg);
      const argarr = await Promise.all(Array.from(prog.first().as_iter())
        .map(async _ => await parseCoin(_)));

      if (process.env.SHOW_LOG) {
        console.log(`generated ${argarr.length} coins`);
      }
      // res.send(JSON.stringify(argarr, null, 4))
      res.send(JSON.stringify(argarr))
    }
    catch (err) {
      console.warn(err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
    }
    finally {
      if (process.env.SHOW_LOG) {
        console.timeEnd("parse_block");
      }
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

  app.post('/analyze_tx', async (req: express.Request, res: express.Response) => {
    let r: AnalyzeTxRequest | null = null;
    try {
      r = req.body as AnalyzeTxRequest;
      // console.log(`${JSON.stringify(r)},`);
      const coin = { amount: BigInt(r.amount), parent_coin_info: r.coin_parent as Hex0x, puzzle_hash: r.puzzle_hash as Hex0x };

      const uncPuzzle = await uncurryPuzzle(sexpAssemble(r.puzzle), r.puzzle);
      const decPuzzle = convertUncurriedPuzzle(uncPuzzle);
      const mods = getModsPath(decPuzzle);
      const analysis = await analyzeCoin(mods, uncPuzzle, coin, r.solution);

      res.send(JSON.stringify({
        coin_name: r.coin_name,
        parsed_puzzle: decPuzzle,
        mods,
        analysis: analysis,
      }))
    }
    catch (err) {
      console.warn(err);
      if (r) console.log(`${JSON.stringify(r)},`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
    }
  });

  app.post('/batch_send', async (req: express.Request, res: express.Response) => {
    let r: BatchSendRequest | null = null;
    try {
      r = req.body as BatchSendRequest;
      r.chainId = r.chainId || "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
      r.prefix = r.prefix || "xch";
      r.symbol = r.symbol || "XCH";

      const sk = Instance.BLS?.PrivateKey.from_bytes(utility.fromHexString(r.privateKey), false);
      if (!sk) {
        res.status(400).send(JSON.stringify({ success: false, error: "private key cannot be parsed" }))
        return;
      }

      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(r.senderAddress));
      const pubkey = utility.toHexString(sk.get_g1().serialize());
      const synPubKey = prefix0x(await puzzle.getSyntheticKey(pubkey));
      const tokenPuzzles: TokenPuzzleDetail[] = [];
      const catList: CustomCat[] = [];
      const tokenNames: string[] = [];
      const puz = await puzzle.getPuzzle(synPubKey);
      const hash = await puzzle.getPuzzleHashFromPuzzle(puz);
      const tgts = r.transferTarget.map(_ => <TransferTarget>{
        symbol: _.symbol,
        address: prefix0x(puzzle.getPuzzleHashFromAddress(_.address)),
        amount: _.amount,
        memos: _.memos
      })

      for (const tgt of tgts) {
        tokenPuzzles.push({
          symbol: tgt.symbol,
          puzzles: [
            {
              privateKey: sk,
              synPubKey,
              puzzle: puz,
              hash: hash,
              address: "",
            }
          ]
        })
        catList.push({ name: tgt.symbol, id: tgt.symbol });
        tokenNames.push(tgt.symbol)
      }
      const coins = (await receive.getActivities(tokenPuzzles, false, "https://walletapi.chiabee.net/"))
        .filter((_) => _.coin)
        .map((_) => _.coin as CoinItem)
        .map((_) => ({
          amount: BigInt(_.amount),
          parent_coin_info: _.parentCoinInfo,
          puzzle_hash: _.puzzleHash,
        }));
      const availcoins = tokenNames
        .map((symbol) => {
          const tgtpuzs = tokenPuzzles.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
          return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
        })
        .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});

      const observers = await receive.getAssetsRequestDetail(r.privateKey, 0, 12, catList, {}, r.prefix, r.symbol, "cat_v2");
      const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, BigInt(r.fee), r.symbol);
      const net: NetworkContext = {
        chainId: r.chainId,
        prefix: r.prefix,
        symbol: r.symbol,
        api: (_) => getLineageProofPuzzle(_, "https://walletapi.chiabee.net/"),
      };
      const ubundle = await transfer.generateSpendBundleIncludingCat(plan, observers, [], net);
      const bundle = await signSpendBundle(ubundle, tokenPuzzles, net);

      res.send(JSON.stringify({
        bundle,
      }))
    }
    catch (err) {
      console.warn(err);
      if (r) console.log(`${JSON.stringify(r)},`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
    }
  })

  app.post('/cns_offer', async (req: express.Request, res: express.Response) => {
    let r: CnsOfferRequest | null = null;
    try {
      r = req.body as CnsOfferRequest;
      if (!r.metadata) {
        res.status(400).send(JSON.stringify({ success: false, error: "metadata cannot be empty" }))
        return;
      }
      if (!r.metadata.bindings) r.metadata.bindings = {};

      // console.log(`${JSON.stringify(r)},`);

      r.chainId = r.chainId || "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
      r.prefix = r.prefix || "xch";
      r.symbol = r.symbol || "XCH";
      if (r.metadata.bindings.address?.startsWith("xch1")) r.metadata.bindings.address = puzzle.getPuzzleHashFromAddress(r.metadata.bindings.address);

      const availcoinsForMaker: SymbolCoins = {
        [r.symbol]: [
          {
            "amount": 1n,
            "parent_coin_info": r.coin.parent_coin_info,
            "puzzle_hash": r.coin.puzzle_hash,
          },
        ],
      };
      const sk = Instance.BLS?.PrivateKey.from_bytes(utility.fromHexString(r.privateKey), false);
      if (!sk) {
        res.status(400).send(JSON.stringify({ success: false, error: "private key cannot be parsed" }))
        return;
      }

      const pubkey = utility.toHexString(sk.get_g1().serialize());
      const synPubKey = prefix0x(await puzzle.getSyntheticKey(pubkey));
      const tokenPuzzles: TokenPuzzleDetail[] = [{
        symbol: r.symbol,
        puzzles: [
          {
            privateKey: sk,
            synPubKey,
            puzzle: r.puzzleText,
            hash: r.puzzleHash,
            address: "",
          }
        ]
      }]
      const royaltyAddressHex = puzzle.getPuzzleHashFromAddress(r.royaltyAddress);
      const net: NetworkContext = {
        chainId: r.chainId,
        prefix: r.prefix,
        symbol: r.symbol,
        api: (_) => getLineageProofPuzzle(_, "https://walletapi.chiabee.net/"),
      };
      const uofferBundle = await generateMintCnsOffer(
        r.targetAddress,
        r.changeAddress,
        BigInt(r.price),
        BigInt(r.fee),
        r.metadata,
        availcoinsForMaker,
        tokenPuzzles,
        royaltyAddressHex,
        r.royaltyPercentage,
        net,
        r.nonce,
        r.intermediateKey);
      const offerBundle = await signSpendBundle(uofferBundle, tokenPuzzles, net.chainId);
      const offer = await encodeOffer(offerBundle, 4);

      res.send(JSON.stringify({
        offer,
      }))
    }
    catch (err) {
      console.warn(err);
      if (r) console.log(`${JSON.stringify(r)},`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
    }
  });

  app.post('/puzzle', async (req: express.Request, res: express.Response) => {
    let r: PuzzleRequest | null = null;
    try {
      r = req.body as PuzzleRequest;

      if (r.method == "ToAddress" && r.parameters?.[0]) {
        res.send(JSON.stringify({
          address: puzzle.getAddressFromPuzzleHash(r.parameters?.[0], "xch")
        }))
      }
      else {
        res.status(400).send(JSON.stringify({ success: false, error: "unrecognized method" }))
      }
    }
    catch (err) {
      console.warn(err);
      if (r) console.log(`${JSON.stringify(r)},`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }))
    }
  });
});

export default app;