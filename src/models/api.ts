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
