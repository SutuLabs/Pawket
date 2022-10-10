import { NftCoinAnalysisResult, NftMetadataValues } from "./nft";

export interface CnsCoinAnalysisResult extends NftCoinAnalysisResult {
  cns?: string;
}

export interface CnsMetadataValues  extends NftMetadataValues {
  imageUri: string | string[] | undefined;
  imageHash: string | undefined;
  metadataUri: string | string[] | undefined;
  metadataHash: string | undefined;
  licenseUri: string | string[] | undefined;
  licenseHash: string | undefined;
  serialNumber: string | undefined;
  serialTotal: string | undefined;
  address: string | undefined;
  name: string | undefined;
  contentHash: string | undefined;
  text: string | undefined;
  dns: string | undefined;
  publicKey: string | undefined;
  reserved: string | undefined;
};
