import { Hex0x, prefix0x, unprefix0x } from "./condition";
import { GetPuzzleApiCallback } from "../transfer/transfer";
import { CoinItem } from "../../models/wallet";
import { OriginCoin } from "../spendbundle";
import { toHex, fromHex, Coin } from "chia-wallet-sdk-bundle";

export interface NetworkContext {
  prefix: string;
  symbol: string;
  chainId: string;
  api: GetPuzzleApiCallback;
}

export interface NetworkContextWithOptionalApi {
  prefix: string;
  symbol: string;
  chainId: string;
  api?: GetPuzzleApiCallback;
}

export interface CompatibleCoin {
  amount: bigint | number;
  parent_coin_info: Hex0x | string;
  puzzle_hash: Hex0x | string;
}

export interface LockedCoin {
  coinName: string;
  coin: OriginCoin;
  transactionTime: number;
  network: string;
  symbol?: string;
  accountFinger: number;
}

export interface PendingTransaction {
  coin: LockedCoin[];
  time: number;
  network: string;
  amount: { [key: string]: bigint };
}

export function getCoinName0x(coin: CompatibleCoin): Hex0x {
  return prefix0x(toHex(getCoinNameHex(coin)));
}

export function getCoinName(coin: CompatibleCoin): string;
export function getCoinName(coin: undefined): undefined;
export function getCoinName(coin: CompatibleCoin | undefined): string | undefined;
export function getCoinName(coin: CompatibleCoin | undefined): string | undefined {
  if (!coin) return coin;
  return toHex(getCoinNameHex(coin));
}

export function getCoinNameHex(coin: CompatibleCoin): Uint8Array {
  const c = new Coin(fromHex(unprefix0x(coin.parent_coin_info)), fromHex(unprefix0x(coin.puzzle_hash)), BigInt(coin.amount));
  return c.coinId();
}

export function convertToOriginCoin(
  coin: CoinItem | { amount: number; parent_coin_info: Hex0x | string; puzzle_hash: Hex0x | string }
): OriginCoin {
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
