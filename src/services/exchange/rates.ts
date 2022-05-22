import { GetExchangeRateResponse } from "@/models/api";
import { rpcUrl } from "@/store/modules/network";

export async function getExchangeRate(from: string, to: string): Promise<number> {
  try {
    const resp = await fetch(rpcUrl() + "misc/prices", {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    const rates = (await resp.json()) as GetExchangeRateResponse[];
    for (const r of rates) {
      if (r.from === from && r.to === to) {
        return r.price;
      }
    }
  } catch (error) {
    console.warn(error);
  }
  return -1;
}
