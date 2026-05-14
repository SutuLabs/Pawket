import "dotenv/config";
import express from "express";
import { Instance } from "../lib-chia/services/util/instance";
import fetch from "cross-fetch";
import { parseBlockFunc, parsePuzzleFunc, parseTxFunc, parseTxsFunc } from "./route/parse";
import { getBatchSendFunc } from "./route/send";
import { getCreateCnsOfferFunc } from "./route/cns";
import { puzzleFunc } from "./route/puzzle";
import { getInscribeMintFunc } from "./route/inscription";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
global.fetch = fetch;
const app: express.Express = express();
app.use(express.json({ limit: process.env.BODY_SIZE_LIMIT || "10m" }));
app.use(express.urlencoded({ extended: true }));
const defaultRpcUrl = "https://walletapi.chiabee.net/";

Instance.init().then(() => {
  app.get("/version", async (_req: express.Request, res: express.Response) => {
    res.send(JSON.stringify({ version: "0.1" }));
  });

  app.post("/parse_block", parseBlockFunc);
  app.post("/parse_puzzle", parsePuzzleFunc);
  app.post("/analyze_tx", parseTxFunc);
  app.post("/analyze_txs", parseTxsFunc);

  app.post("/batch_send", getBatchSendFunc({ defaultRpcUrl }));
  app.post("/cns_offer", getCreateCnsOfferFunc({ defaultRpcUrl }));
  app.post("/puzzle", puzzleFunc);
  app.post("/inscribe_mint", getInscribeMintFunc({ defaultRpcUrl }));
});

export default app;
