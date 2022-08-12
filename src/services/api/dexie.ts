export interface DexieOfferResponse {
  success: boolean;
  count: number;
  page: number;
  page_size: number;
  offers: Offer[];
}

export interface Offer {
  id: string;
  status: number;
  offer: string;
  offered_coins: string[];
  date_found: Date;
  date_completed: null;
  date_pending: null;
  spent_block_index: null;
  price: number;
  offered: Offered[];
  requested: Requested[];
  previous_price: number | null;
  fees: number;
}

export interface Offered {
  id: string;
  code: string;
  name: string;
  amount: number;
}

export interface Requested {
  is_nft: boolean;
  id: string;
  name: string;
  preview: Preview;
  nft_data: NftData;
  collection: Collection;
}

export interface Collection {
  id: string;
  name: string;
  website: null | string;
  twitter: null | string;
  discord: null | string;
  verified: boolean;
  verifications: Verifications;
  blocked: boolean;
  suspicious: boolean;
}

export interface Verifications {
  dns?: DNS;
  twitter?: DNS;
  did?: Did;
}

export interface Did {
  via: string;
  date: Date;
  name: string;
}

export interface DNS {
  name: string;
  date_checked: Date;
}

export interface NftData {
  data_uris: string[];
  metadata_uris: string[];
  license_uris: string[];
  license_hash: string;
  data_hash: string;
  metadata_hash: string;
  creator: Creator;
  height: number;
  royalty: number;
}

export interface Creator {
  id: string;
  is_did: boolean;
}

export interface Preview {
  tiny: string;
  medium: string;
}

class Dexie {
  private dexieUrl = "https://api.dexie.space/v1/offers";

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
    const resp = await fetch(`${this.dexieUrl}?${params}`);
    if (resp.status !== 200) {
      throw new Error(await resp.text());
    }
    return (await resp.json()) as DexieOfferResponse;
  }

  public async uploadOffer(offer: string): Promise<void> {
    const resp = await fetch(this.dexieUrl, {
      method: "POST",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Method": "POST,GET",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offer: offer }),
    });
    const res = await resp.json();
  }
}

export default new Dexie();
