import { GetBlockResponse, GetCoinSolutionResponse } from "../../models/api";
import { CoinSpend } from "../spendbundle";
import pako from "pako";

class DebugApi {
  public async getCoinSolution(coinId: string, rpcUrl: string, isForce = false): Promise<CoinSpend> {
    const key = `${rpcUrl}-getCoinSolution-${coinId}`;
    let response = await caches.match(key);
    if (response === undefined || isForce) {
      response = await fetch(rpcUrl + "Wallet/get-coin-solution", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coinIds: [coinId],
        }),
      });

      if (response.status == 200) {
        const responseClone = response.clone();
        caches.open("debug").then((cache) => {
          cache.put(key, responseClone);
        });
      }
    }

    if (response.status != 200) {
      throw new Error(`unexpected response code ${response.status}`);
    }

    const presp = (await response.json()) as GetCoinSolutionResponse;
    if (!presp.coinSpends || presp.coinSpends.length == 0) {
      throw new Error("empty response");
    }
    const cs = presp.coinSpends?.at(0);
    if (!cs) {
      caches.open("debug").then((cache) => cache.delete(key));
      throw new Error("abnormal response");
    }
    if (!cs.solution || !cs.puzzle_reveal) {
      caches.open("debug").then((cache) => cache.delete(key));
    }
    return cs;
  }

  public async getBlock(index: number, rpcUrl: string, isForce = false): Promise<GetBlockResponse> {
    const key = `${rpcUrl}-getBlock-${index}`;
    let response = await caches.match(key);
    if (response === undefined || isForce) {
      response = await fetch(rpcUrl + "Wallet/get-block", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          indexes: [index],
        }),
      });

      if (response.status == 200) {
        const responseClone = response.clone();
        caches.open("debug").then((cache) => {
          cache.put(key, responseClone);
        });
      }
    }

    const presp = (await response.json()) as GetBlockResponse;
    const pp = {
      blocks: presp.blocks.map((_) => ({
        index: _.index,
        generator: decompressZlib(_.generator),
        generator_ref_list: _.generator_ref_list,
      })),
      refBlocks: presp.refBlocks.map((_) => ({
        index: _.index,
        generator: decompressZlib(_.generator),
        generator_ref_list: _.generator_ref_list,
      })),
    };

    return pp;
  }
}

function decompressZlib(base64String: string): string {
  return Buffer.from(pako.inflate(Buffer.from(base64String, "base64"))).toString("hex");
}

export default new DebugApi();
