export interface CollectionItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHash: string;
  properties: Property[];
  creator?: string;
  address: string;
  royalPercentage: number;
  royalAddress: string;
  licenseUrl: string;
}

export interface Property {
  attribute: string;
  value: string;
}
