import { CoinSpend } from "../services/spendbundle";

export interface ApiResponse {
  error?: string;
  success?: boolean;
}

export interface GetParentPuzzleRequest {
  parentCoinId: string;
}

export interface GetParentPuzzleResponse {
  amount: number;
  parentCoinId: string;
  parentParentCoinId: string;
  puzzleReveal: string;
}

export interface GetCoinSolutionResponse {
  coinSpends: CoinSpend[];
}

export interface GetExchangeRateResponse {
  source: string;
  from: string;
  to: string;
  price: number;
  time: string;
}

export interface GetBlockResponse {
  blocks: BlockTransactionGeneratorRetrieval[];
  refBlocks: BlockTransactionGeneratorRetrieval[];
};

export interface BlockTransactionGeneratorRetrieval {
  index: number;
  generator: string;
  generator_ref_list: number[];
};
