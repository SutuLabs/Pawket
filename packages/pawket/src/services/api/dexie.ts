import { DexieOfferResponse } from "@/models/dexieOffer";
import { Market, Markets } from "@/models/market";
import { chainId, mainnetChainId, rpcUrl } from "@/store/modules/network";

class Dexie {
  public dexieIconUrl = "https://icons.dexie.space/";

  private dexieOfferUrl(): string {
    return chainId() == mainnetChainId() ? "https://api.dexie.space/v1" : "https://api-testnet.dexie.space/v1";
  }

  private dexieMarketUrl(): string {
    return chainId() == mainnetChainId() ? "https://api.dexie.space/v1" : "https://testnet.dexie.space/v1";
  }

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
    const resp = await fetch(`${this.dexieOfferUrl()}/offers?${params}`);
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    return (await resp.json()) as DexieOfferResponse;
  }

  public async uploadOffer(offer: string): Promise<unknown> {
    const resp = await fetch(rpcUrl() + "Wallet/offers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offer: offer }),
    });

    if (resp.status != 200) throw new Error("error uploading offer, status: " + resp.status);
    return null;
  }

  public async getMarket(): Promise<Markets> {
    const resp = await fetch(this.dexieMarketUrl() + "/markets", { method: "GET", redirect: "follow" });
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    const res = (await resp.json()) as Market;
    if (res.success) return res.markets;
    return {} as Markets;
  }

  public async getNftMarket(): Promise<Markets> {
    const params = new URLSearchParams();
    params.append("by", "volume");
    params.append("interval", "weekly");
    const resp = await fetch(this.dexieMarketUrl() + `/nft_markets?${params}`, { method: "GET", redirect: "follow" });
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    const res = (await resp.json()) as Market;
    if (res.success) return res.markets;
    return {} as Markets;
  }
}

export default new Dexie();
