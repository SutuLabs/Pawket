export interface Market {
  success: boolean;
  markets: Markets;
}

export interface Markets {
  xch: MarketItem[];
}

export interface MarketItem {
  id: string;
  code?: string;
  name: string;
  is_nft: number;
  icon: string;
}
