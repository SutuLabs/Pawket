import { DidCoinAnalysisResult } from "../services/coin/did";
import { Hex0x } from "../services/coin/condition";
import { CnsCoinAnalysisResult, NftCoinAnalysisResult } from "./nft";

export interface GetRecordsRequest {
  puzzleHashes: string[];
  startHeight?: number;
  endHeight?: number;
  includeSpentCoins: boolean;
}

export interface GetRecordsResponse {
  peekHeight: number;
  coins: CoinRecordInfo[];
}

export interface CoinRecordInfo {
  puzzleHash: string;
  records: CoinRecord[];
  balance: string;
}

export interface CoinRecord {
  coin?: CoinItem;
  coinbase: boolean;
  confirmedBlockIndex: number;
  spent: boolean;
  spentBlockIndex: number;
  timestamp: number;
  symbol?: string;
  analysis?: NftCoinAnalysisResult | CnsCoinAnalysisResult | DidCoinAnalysisResult;
}

export interface CoinItem {
  amount: number;
  parentCoinInfo: Hex0x;
  puzzleHash: Hex0x;
}
