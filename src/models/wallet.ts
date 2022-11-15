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

export interface SpendBundle extends UnsignedSpendBundle {
    aggregated_signature: Hex0x;
}

export interface UnsignedSpendBundle {
    coin_spends: CoinSpend[];
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