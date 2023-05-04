import { GetBlockResponse, GetCoinSolutionResponse } from "../../models/api";
import { CoinSpend } from "../spendbundle";
import pako from 'pako';

class DebugApi {
  public async getCoinSolution(coinId: string, rpcUrl: string, isForce = false): Promise<CoinSpend> {
    const key = `getCoinSolution-${coinId}`;
    let response = await caches.match(key);
    if (response === undefined || isForce) {
      response = await fetch(rpcUrl + "Wallet/get-coin-solution", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coinIds: [coinId]
        }),
      });

      const responseClone = response.clone();
      caches.open("debug").then((cache) => {
        cache.put(key, responseClone);
      });
    }

    const presp = await response.json() as GetCoinSolutionResponse;
    const cs = presp.coinSpends?.at(0);
    if (!cs) {
      caches.open("debug").then((cache) => {
        cache.delete(key);
      });
      throw new Error("abnormal response");
    }
    return cs;
  }

  public async getBlock(index: number, rpcUrl: string, isForce = false): Promise<GetBlockResponse> {
    const key = `getBlock-${index}`;
    let response = await caches.match(key);
    if (response === undefined || isForce) {
      response = await fetch(rpcUrl + "Wallet/get-block", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indexes: [index]
        }),
      });

      const responseClone = response.clone();
      caches.open("debug").then((cache) => {
        cache.put(key, responseClone);
      });
    }

    const presp = await response.json() as GetBlockResponse;
    const pp = {
      blocks: presp.blocks.map(_ => ({ index: _.index, generator: decompressZlib(_.generator), generator_ref_list: _.generator_ref_list })),
      refBlocks: presp.refBlocks.map(_ => ({ index: _.index, generator: decompressZlib(_.generator), generator_ref_list: _.generator_ref_list })),
    };

    return pp;
  }
}

function decompressZlib(base64String: string): string {
  return Buffer.from((pako.inflate(Buffer.from(base64String, 'base64')))).toString('hex');
}

export default new DebugApi();