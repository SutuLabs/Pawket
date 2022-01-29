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
}


export interface CoinRecord {
    Coin?: CoinItem;
    Coinbase: boolean;
    ConfirmedBlockIndex: number;
    Spent: boolean;
    SpentBlockIndex: number;
    Timestamp: number;
}

export interface CoinItem {
    Amount: number;
    ParentCoinInfo: string;
    PuzzleHash: string;
}

