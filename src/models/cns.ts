export interface CnsCoinAnalysisResult {
  singletonModHash: string;
  launcherId: string;
  launcherPuzzleHash: string;
  nftStateModHash: string;
  metadataUpdaterPuzzleHash: string;
  p2InnerPuzzle: string;
  hintPuzzle: string;
  nftOwnershipModHash: string;
  previousOwner: string;
  didOwner: string;
  p2Owner: string;
  royaltyAddress: string;
  tradePricePercentage: number;
  rawMetadata: string;
  metadata: NftMetadataValues;
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
