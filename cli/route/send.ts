import express from "express";
import { CustomCat } from "../../lib-chia/models/account";
import { CoinItem } from "../../lib-chia/models/wallet";
import { NetworkContext } from "../../lib-chia/services/coin/coinUtility";
import { prefix0x } from "../../lib-chia/services/coin/condition";
import puzzle from "../../lib-chia/services/crypto/puzzle";
import receive from "../../lib-chia/services/crypto/receive";
import utility from "../../lib-chia/services/crypto/utility";
import { signSpendBundle } from "../../lib-chia/services/spendbundle";
import { getLineageProofPuzzle } from "../../lib-chia/services/transfer/call";
import transfer, { SymbolCoins, TransferTarget } from "../../lib-chia/services/transfer/transfer";
import { Instance } from "../../lib-chia/services/util/instance";

interface TransferTargetOrigin {
  assetId: string;
  address: string;
  amount: bigint;
  memos?: string[];
}

interface BatchSendRequest {
  privateKey: string;
  transferTarget: TransferTargetOrigin[];
  changeAddress?: string;
  fee?: number;
  chainId?: string;
  symbol?: string;
  prefix?: string;
  availcoins?: SymbolCoins;
  rpcUrl?: string;
}

export function getBatchSendFunc(option: {
  defaultRpcUrl: string;
}): (req: express.Request, res: express.Response) => Promise<void> {
  const { defaultRpcUrl } = option;
  return async function batchSendFunc(req: express.Request, res: express.Response): Promise<void> {
    let r: BatchSendRequest | null = null;
    try {
      r = req.body as BatchSendRequest;
      r.chainId = r.chainId || "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
      r.prefix = r.prefix || "xch";
      r.symbol = r.symbol || "XCH";
      const rpcUrl = r.rpcUrl || defaultRpcUrl;

      const sk = Instance.BLS?.PrivateKey.from_bytes(utility.fromHexString(r.privateKey), false);
      if (!sk) {
        res.status(400).send(JSON.stringify({ success: false, error: "private key cannot be parsed" }));
        return;
      }

      const catList: CustomCat[] = [];
      const tokenNames: string[] = [];
      const tgts = r.transferTarget.map(
        (_) =>
          <TransferTarget>{
            symbol: _.assetId,
            address: prefix0x(puzzle.getPuzzleHashFromAddress(_.address)),
            amount: BigInt(_.amount),
            memos: _.memos,
          }
      );

      for (const tgt of tgts) {
        if (!catList.find((_) => _.id == tgt.symbol)) {
          catList.push({ name: tgt.symbol, id: tgt.symbol });
          tokenNames.push(tgt.symbol);
        }
      }
      const observers = await receive.getAssetsRequestDetail(r.privateKey, 0, 12, catList, {}, r.prefix, r.symbol, "cat_v2");
      const change_hex = prefix0x(
        r.changeAddress ? puzzle.getPuzzleHashFromAddress(r.changeAddress) : observers[0].puzzles[1].hash
      );

      if (change_hex.length != 66) {
        res.status(400).send(JSON.stringify({ success: false, error: "change address cannot be parsed or found." }));
        return;
      }

      let availcoins = r.availcoins;
      if (!availcoins) {
        const coins = (await receive.getActivities(observers, false, rpcUrl))
          .filter((_) => _.coin)
          .map((_) => _.coin as CoinItem)
          .map((_) => ({
            amount: BigInt(_.amount),
            parent_coin_info: _.parentCoinInfo,
            puzzle_hash: _.puzzleHash,
          }));
        availcoins = tokenNames
          .map((symbol) => {
            const tgtpuzs = observers.filter((_) => _.symbol == symbol)[0].puzzles.map((_) => prefix0x(_.hash));
            return { symbol, coins: coins.filter((_) => tgtpuzs.findIndex((p) => p == _.puzzle_hash) > -1) };
          })
          .reduce((a, c) => ({ ...a, [c.symbol]: c.coins }), {});
      }

      const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, BigInt(r.fee || 0), r.symbol);
      const net: NetworkContext = {
        chainId: r.chainId,
        prefix: r.prefix,
        symbol: r.symbol,
        api: (_) => getLineageProofPuzzle(_, rpcUrl),
      };
      const ubundle = await transfer.generateSpendBundleIncludingCat(plan, observers, [], net);
      const bundle = await signSpendBundle(ubundle, observers, net);

      res.send(
        JSON.stringify({
          spend_bundle: bundle,
        })
      );
    } catch (err) {
      console.warn(err);
      if (r) console.log(`${JSON.stringify(r)},`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.status(500).send(JSON.stringify({ success: false, error: (<any>err).message }));
    }
  };
}
