import express from "express";
import { NetworkContext } from "../../lib-chia/services/coin/coinUtility";
import { prefix0x } from "../../lib-chia/services/coin/condition";
import puzzle from "../../lib-chia/services/crypto/puzzle";
import { TokenPuzzleDetail } from "../../lib-chia/services/crypto/receive";
import utility from "../../lib-chia/services/crypto/utility";
import { OriginCoin, UnsignedSpendBundle, signSpendBundle } from "../../lib-chia/services/spendbundle";
import { getLineageProofPuzzle } from "../../lib-chia/services/transfer/call";
import transfer, { SymbolCoins, TransferTarget } from "../../lib-chia/services/transfer/transfer";
import { Instance } from "../../lib-chia/services/util/instance";

interface InscriptionMintRequest {
  targetAddress: string;
  changeAddress: string;
  fee?: number;
  coin: OriginCoin;

  tick?: string;
  op?: string;
  amt?: number;
  lim?: number;
  max?: number;
  protocol?: string;

  repeat?: number;

  // following 3 get from pawket account info
  privateKey: string;
  puzzleHash: string;
  puzzleText: string;

  // optional network information
  chainId?: string;
  symbol?: string;
  prefix?: string;
  rpcUrl?: string;
}
// temporary checked-in without test

export function getInscribeMintFunc(option: {
  defaultRpcUrl: string;
}): (req: express.Request, res: express.Response) => Promise<void> {
  const { defaultRpcUrl } = option;
  return async function (req: express.Request, res: express.Response): Promise<void> {
    let r: InscriptionMintRequest | null = null;
    try {
      r = req.body as InscriptionMintRequest;
      console.log(`${JSON.stringify(r)},`);

      r.chainId = r.chainId || "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
      r.prefix = r.prefix || "xch";
      r.symbol = r.symbol || "XCH";
      const rpcUrl = r.rpcUrl || defaultRpcUrl;

      const availcoinsForMaker: SymbolCoins = {
        [r.symbol]: [r.coin],
      };
      const sk = Instance.BLS?.PrivateKey.from_bytes(utility.fromHexString(r.privateKey), false);
      if (!sk) {
        res.status(400).send(JSON.stringify({ success: false, error: "private key cannot be parsed" }));
        return;
      }

      const pubkey = utility.toHexString(sk.get_g1().serialize());
      const synPubKey = prefix0x(await puzzle.getSyntheticKey(pubkey));
      const tokenPuzzles: TokenPuzzleDetail[] = [
        {
          symbol: r.symbol,
          puzzles: [
            {
              privateKey: sk,
              synPubKey,
              puzzle: r.puzzleText,
              hash: r.puzzleHash,
              address: "",
            },
          ],
        },
      ];
      const net: NetworkContext = {
        chainId: r.chainId,
        prefix: r.prefix,
        symbol: r.symbol,
        api: (_) => getLineageProofPuzzle(_, rpcUrl),
      };

      // const hint = prefix0x(sha256(Buffer.from(`{'p':'xchs','tick':'${this.tick}'}`)));
      if (r.op != "mint" && r.op != "transfer" && r.op != "deploy") {
        res.status(400).send(JSON.stringify({ success: false, error: "invalid op" }));
        return;
      }
      if (!r.tick) {
        res.status(400).send(JSON.stringify({ success: false, error: "invalid tick" }));
        return;
      }
      const memo = getInscriptionMemo(r.op, r.tick, r.max, r.lim, r.amt, r.protocol);
      const fee = BigInt(r.fee ?? 0);

      const repeat = r.repeat ?? 1;
      const tgt_hex = prefix0x(r.targetAddress);
      const change_hex = prefix0x(r.changeAddress);

      let ubundle: UnsignedSpendBundle;
      let repeatMojo = 1n;
      if (r.op == "deploy" || r.op == "transfer") {
        const tgts: TransferTarget[] = [{ address: tgt_hex, amount: 1n, symbol: net.symbol, memos: [memo] }];

        const plan = transfer.generateSpendPlan(availcoinsForMaker, tgts, change_hex, fee, net.symbol);
        ubundle = await transfer.generateSpendBundleWithoutCat(plan, tokenPuzzles, [], net);
      } else if (r.op == "mint") {
        const tgts: TransferTarget[] = [];

        repeatMojo = 0n;
        for (let i = 0; i < repeat; i++) {
          const amt = BigInt(i + 1);
          tgts.push({ address: tgt_hex, amount: amt, symbol: net.symbol, memos: [memo] });
          repeatMojo += amt;
        }

        const plan = transfer.generateSpendPlan(availcoinsForMaker, tgts, change_hex, BigInt(fee), net.symbol);
        ubundle = await transfer.generateSpendBundleWithoutCat(plan, tokenPuzzles, [], net);
      } else {
        throw Error("not support");
      }

      const bundle = await signSpendBundle(ubundle, tokenPuzzles, net);

      res.send(
        JSON.stringify({
          bundle,
          repeatMojo,
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

function getInscriptionMemo(
  type: "deploy" | "mint" | "transfer",
  tick: string,
  total?: number,
  limit?: number,
  amount?: number,
  protocol?: string
): string {
  protocol = protocol ?? "xchs";
  if (type == "deploy") {
    return `{'p':'${protocol}','op':'deploy','tick':'${tick}','max':'${total}','lim':'${limit}'}`;
  } else if (type == "mint") {
    return `{'p':'${protocol}','op':'mint','tick':'${tick}','amt':'${amount}'}`;
  } else if (type == "transfer") {
    return `{'p':'${protocol}','op':'transfer','tick':'${tick}','amt':'${amount}'}`;
  } else {
    throw Error("not support");
  }
}
