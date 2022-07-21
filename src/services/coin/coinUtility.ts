import { OriginCoin } from "@/models/wallet";
import { prefix0x } from "./condition";
import { Bytes, bigint_to_bytes } from "clvm";

export function getCoinName0x(coin: OriginCoin): string {
  return prefix0x(getCoinNameHex(coin).hex());
}

export function getCoinName(coin: OriginCoin): string {
  return getCoinNameHex(coin).hex();
}

export function getCoinNameHex(coin: OriginCoin): Bytes {
  const a = bigint_to_bytes(BigInt(coin.amount), { signed: true });
  const pci = Bytes.from(coin.parent_coin_info, "hex");
  const ph = Bytes.from(coin.puzzle_hash, "hex");
  const cont = pci.concat(ph).concat(a);
  const coinname = Bytes.SHA256(cont);
  return coinname;
}