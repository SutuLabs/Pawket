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
    coin?: CoinItem;
    coinbase: boolean;
    confirmedBlockIndex: number;
    spent: boolean;
    spentBlockIndex: number;
    timestamp: number;
    symbol?: string;
}

export interface CoinItem {
    amount: number;
    parentCoinInfo: string;
    puzzleHash: string;
}

export interface OriginCoin {
    amount: bigint;
    parent_coin_info: string;
    puzzle_hash: string;
}

export interface CoinSpend {
    coin: OriginCoin;
    puzzle_reveal: string;
    solution: string;
}

export interface SpendBundle {
    aggregated_signature: string;
    coin_spends: CoinSpend[];
}

export interface PuzzleInfo {
    puzzleHash: string;
    puzzle: string;
    privateKey: Uint8Array;
    index:number;
}