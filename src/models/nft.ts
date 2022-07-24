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
