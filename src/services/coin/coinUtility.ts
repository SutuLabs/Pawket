import { Hex0x, prefix0x } from "./condition";
import { Bytes, bigint_to_bytes } from "clvm";
import { GetPuzzleApiCallback } from "../transfer/transfer";
import { CoinItem } from "@/models/wallet";
import { OriginCoin } from "../spendbundle/defs";

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

export function getCoinName0x(coin: CompatibleCoin): Hex0x {
  return prefix0x(getCoinNameHex(coin).hex());
}

export function getCoinName(coin: CompatibleCoin): string {
  return getCoinNameHex(coin).hex();
}

export function getCoinNameHex(coin: CompatibleCoin): Bytes {
  const a = bigint_to_bytes(BigInt(coin.amount), { signed: true });
  const pci = Bytes.from(coin.parent_coin_info, "hex");
  const ph = Bytes.from(coin.puzzle_hash, "hex");
  const cont = pci.concat(ph).concat(a);
  const coinname = Bytes.SHA256(cont);
  return coinname;
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