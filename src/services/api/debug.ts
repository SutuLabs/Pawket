import { GetCoinSolutionResponse } from "@/models/api";
import { CoinSpend } from "@/services/spendbundle";

class DebugApi {
  public async getCoinSolution(coinId: string, rpcUrl: string): Promise<CoinSpend> {
    const resp = await fetch(rpcUrl + "Wallet/get-coin-solution", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coinId
      }),
    });

    const presp = await resp.json() as GetCoinSolutionResponse;
    return presp.coinSpend;
  }
}

export default new DebugApi();