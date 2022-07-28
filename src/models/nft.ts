import { NftDetail } from "@/services/crypto/receive";

export interface NftItemAttribute {
  trait_type: string;
  value: string;
  min_value: string;
  max_value: string;
}

export interface NftCollectionAttribute {
  type: string;
  value: string;
}

export interface NftCollection {
  name: string;
  id: string;
  attributes: NftCollectionAttribute[];
}

interface DownloadedNftInfo {
  metadata?: NftOffChainMetadata;
  matchHash?: boolean;
  status: "Ready" | "NoMetadata" | "Downloading" | "Processed";
}

export type DonwloadedNftCollection = { [name: string]: DownloadedNftInfo };

export interface NftOffChainMetadata {
  format: "CHIP-0007";
  name: string;
  description: string;
  minting_tool: string;
  sensitive_content: boolean;
  series_number: number;
  series_total: number;
  attributes: NftItemAttribute[];
  collection: NftCollection;
  levels: string[];
  stats: string[];
  data: unknown;
}

export interface NftCoinAnalysisResult {
  singletonModHash: string;
  launcherId: string;
  launcherPuzzleHash: string;
  nftStateModHash: string;
  metadataUpdaterPuzzleHash: string;
  p2InnerPuzzle: string;
  hintPuzzle: string;
  nftOwnershipModHash: string,
  previousOwner: string;
  didOwner: string;
  p2Owner: string;
  royaltyAddress: string;
  tradePricePercentage: number;
  rawMetadata: string;
  metadata: NftMetadataValues;
}

export type NftDataKey = "imageUri" | "imageHash" | "metadataUri" | "metadataHash" | "licenseUri" | "licenseHash" | "serialNumber" | "serialTotal";
export type NftMetadataValues = { [key in NftDataKey]: string | undefined; };
export type NftMetadataKeys = { [key in NftDataKey]: string; };