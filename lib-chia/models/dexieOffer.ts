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
  preview: Preview;
  is_nft: boolean;
  nft_data: NftData
}

export interface Preview {
  tiny: string;
  medium: string;
}

export interface NftData {
  data_uris: string[];
}

export interface Requested {
  is_nft: boolean;
  code: string;
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
