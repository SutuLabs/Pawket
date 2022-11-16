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
  coinSpend: CoinSpend;
}

export interface GetExchangeRateResponse {
  source: string;
  from: string;
  to: string;
  price: number;
  time: string;
}