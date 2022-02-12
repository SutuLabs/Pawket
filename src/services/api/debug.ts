import { GetCoinSolutionResponse } from "@/models/api";
import { CoinSpend } from "@/models/wallet";

class DebugApi {
  public async getCoinSolution(coinId: string): Promise<CoinSpend> {
    const resp = await fetch(process.env.VUE_APP_API_URL + "Wallet/get-coin-solution", {
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