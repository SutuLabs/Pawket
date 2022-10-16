import { Hex0x, prefix0x } from "./condition";
import { Bytes, bigint_to_bytes } from "clvm";

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