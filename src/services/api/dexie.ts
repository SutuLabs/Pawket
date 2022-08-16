import { DexieOfferResponse } from "@/models/dexieOffer";
import { Market, Markets } from "@/models/market";

class Dexie {
  private dexieUrl = "https://api.dexie.space/v1";
  public dexieIconUrl = "https://icons.dexie.space/";

  public async getOffer(
    offered: string | null,
    requested: string | null,
    page = 1,
    pageSize = 20
  ): Promise<DexieOfferResponse | null> {
    const params = new URLSearchParams();
    if (offered) params.append("offered", offered);
    if (requested) params.append("requested", requested);
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    params.append("sort", "price_asc");
    const resp = await fetch(`${this.dexieUrl}/offers?${params}`);
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    return (await resp.json()) as DexieOfferResponse;
  }

  public async uploadOffer(offer: string): Promise<unknown> {
    const resp = await fetch(this.dexieUrl + "/offers", {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Method": "POST,GET",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offer: offer }),
    });
    const res = (await resp.json()) as DexieOfferResponse;
    return res;
  }

  public async getMarket(): Promise<Markets> {
    const resp = await fetch(this.dexieUrl + "/markets");
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    const res = (await resp.json()) as Market;
    if (res.success) return res.markets;
    return {} as Markets;
  }

  public async getNftMarket(): Promise<Markets> {
    const resp = await fetch(this.dexieUrl + "/nft_markets");
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    const res = (await resp.json()) as Market;
    if (res.success) return res.markets;
    return {} as Markets;
  }
}

export default new Dexie();
