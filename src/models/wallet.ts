import { Hex0x, prefix0x } from "../services/coin/condition";

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
}

export interface CoinItem {
    amount: number;
    parentCoinInfo: Hex0x;
    puzzleHash: Hex0x;
}

export interface OriginCoin {
    amount: bigint;
    parent_coin_info: Hex0x;
    puzzle_hash: Hex0x;
}

export interface CoinSpend {
    coin: OriginCoin;
    puzzle_reveal: Hex0x;
    solution: Hex0x;
}

export interface SpendBundle {
    aggregated_signature: Hex0x;
    coin_spends: CoinSpend[];
}

export class UnsignedSpendBundle {
    public coin_spends: CoinSpend[];
    public type = "unsigned";

    constructor(coin_spends: CoinSpend[]) {
        this.coin_spends = coin_spends;
    }
}

export class PartialSpendBundle {
    public aggregated_signature: Hex0x;
    public coin_spends: CoinSpend[];
    public type = "partial";

    constructor(coin_spends: CoinSpend[], aggregated_signature: Hex0x) {
        this.coin_spends = coin_spends;
        this.aggregated_signature = aggregated_signature;
    }
}

export function convertToOriginCoin(coin: CoinItem | { amount: number, parent_coin_info: Hex0x | string, puzzle_hash: Hex0x | string }): OriginCoin {
    return "parentCoinInfo" in coin
        ? {
            amount: BigInt(coin.amount),
            parent_coin_info: coin.parentCoinInfo,
            puzzle_hash: coin.puzzleHash,
        }
        : {
            amount: BigInt(coin.amount),
            parent_coin_info: prefix0x(coin.parent_coin_info),
            puzzle_hash: prefix0x(coin.puzzle_hash),
        };
}