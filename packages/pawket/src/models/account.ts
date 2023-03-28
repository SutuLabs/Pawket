import { AccountKey } from "@/services/crypto/account";
import { AddressType } from "@/services/crypto/puzzle";
import { DidDetail, NftDetail, TokenPuzzleDetail, TokenPuzzleObserver } from "@/services/crypto/receive";
import { DonwloadedNftCollection } from "./nft";
import { CoinRecord } from "./wallet";

export type AccountType = "Serial" | "Password" | "Legacy" | "Address" | "PublicKey";

export interface AccountTokenAddress {
  address: string;
  type?: AddressType;
  coins: CoinRecord[];
}

export interface AccountToken {
  amount: bigint;
  addresses: AccountTokenAddress[];
}
export interface AccountTokens {
  [symbol: string]: AccountToken;
}

export interface PersistentAccount {
  key: AccountKey;
  name: string;
  profilePic?: string;
  type: AccountType;
  serial?: number;
  puzzleHash?: string;
  addressRetrievalCount: number;
  cats?: CustomCat[];
  allCats: PersistentCustomCat[];
}

export interface AccountEntity extends PersistentAccount {
  firstAddress?: string;
  activities?: CoinRecord[];
  tokens: AccountTokens;
  nfts?: NftDetail[];
  extraInfo: DonwloadedNftCollection;
  dids?: DidDetail[];
  addressPuzzles: TokenPuzzleDetail[];
  observePuzzles?: TokenPuzzleObserver[];
  addressGenerated: number;
}

export interface CustomCat {
  name: string;
  id: string;
  img?: string;
}

export interface PersistentCustomCat extends CustomCat {
  network: string;
}

export interface TokenInfo {
  [symbol: string]: OneTokenInfo;
}

export interface OneTokenInfo {
  id?: string;
  symbol: string;
  decimal: number;
  unit: string;
  img?: string;
}
