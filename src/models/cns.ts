import { NftCoinAnalysisResult } from "./nft";

export interface CnsCoinAnalysisResult extends NftCoinAnalysisResult {
  cns?: string;
}

export type NftMetadataValues = {
  imageUri: string | string[] | undefined;
  imageHash: string | undefined;
  metadataUri: string | string[] | undefined;
  metadataHash: string | undefined;
  licenseUri: string | string[] | undefined;
  licenseHash: string | undefined;
  serialNumber: string | undefined;
  serialTotal: string | undefined;
};
