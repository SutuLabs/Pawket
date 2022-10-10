import { NftCoinAnalysisResult, NftDataKey, NftMetadataValues } from "./nft";

export interface CnsCoinAnalysisResult extends NftCoinAnalysisResult {
  cns?: string;
}

export interface CnsMetadataValues extends NftMetadataValues {
  address: string | undefined;
  name: string | undefined;
  contentHash: string | undefined;
  text: string | undefined;
  dns: string | undefined;
  publicKey: string | undefined;
  reserved: string | undefined;
};

export type CnsDataKey =NftDataKey| "address" | "name" | "contentHash" | "text" | "dns" | "publicKey" | "reserved";

export type CnsMetadataKeys = { [key in CnsDataKey]: string; };