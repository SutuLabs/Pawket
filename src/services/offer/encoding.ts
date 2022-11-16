import { CoinSpend, OriginCoin, SpendBundle } from "../spendbundle";
import { bech32m } from "@scure/base";
import zlib from 'zlib';
import { Buffer } from 'buffer';
import { Bytes, sexp_buffer_from_stream, Stream, sexp_from_stream, SExp } from "clvm";
import { prefix0x } from '../coin/condition';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import puzzle from "../crypto/puzzle";
import { modshex } from "../coin/mods";

// sync with `chia\wallet\util\puzzle_compression.py`
const initDict = [
  modshex["p2_delegated_puzzle_or_hidden_puzzle"]
  + modshex["cat_v1"],
  modshex["settlement_payments"],
  modshex["singleton_top_layer_v1_1"]
  + modshex["nft_state_layer"]
  + modshex["nft_ownership_layer"]
  + modshex["nft_metadata_updater_default"]
  + modshex["nft_ownership_transfer_program_one_way_claim_with_royalties"],
  modshex["cat_v2"],
  modshex["settlement_payments_v1"],
]
  .map((t => Buffer.from(t, "hex")))


function getDictForVersion(ver: number) {
  let b = Buffer.from([]);
  for (const r of initDict.slice(0, ver))
    b = Buffer.concat([b, r]);
  return b;
}

export async function decodeOffer(offerText: string): Promise<SpendBundle> {
  const offer_compressed = bech32m.decodeToBytes(offerText).bytes;
  const buff = Buffer.from(offer_compressed);

  const ver = buff.readUInt16BE(0);
  if (ver > initDict.length) throw new Error("error offer file version");

  const d = zlib.inflateSync(buff.slice(2), { dictionary: getDictForVersion(ver) });

  let pos = 0;
  const dv = new DataView(d.buffer);
  const spendnum = dv.getUint32(pos, false);
  pos += 32 / 8;
  const spends = [];
  for (let i = 0; i < spendnum; i++) {
    const pci = Bytes.from(d.slice(pos, pos + 32)).hex();
    pos += 32;
    const ph = Bytes.from(d.slice(pos, pos + 32)).hex();
    pos += 32;
    const amount = dv.getBigUint64(pos, false);
    pos += 64 / 8;
    const coin: OriginCoin = {
      parent_coin_info: prefix0x(pci),
      puzzle_hash: prefix0x(ph),
      amount: amount,
    }

    const readSexpBuffer = () => {
      const buff = d.slice(pos);
      const r = sexp_buffer_from_stream(new Stream(Bytes.from(new Uint8Array(buff))));
      const n = r.raw().length;
      pos += n;
      return disassemble(sexp_from_stream(new Stream(r), SExp.to));
    };

    const puzzle_reveal = readSexpBuffer();
    const solution = readSexpBuffer();

    const coinspend: CoinSpend = {
      coin: coin,
      puzzle_reveal: prefix0x(await puzzle.encodePuzzle(puzzle_reveal)),
      solution: prefix0x(await puzzle.encodePuzzle(solution)),
    }

    spends.push(coinspend);
  }

  const sig = Bytes.from(d.slice(pos, pos + 96)).hex();
  pos += 96;

  const bundle: SpendBundle = {
    aggregated_signature: prefix0x(sig),
    coin_spends: spends,
  }

  return bundle;
}

export async function encodeOffer(bundle: SpendBundle, ver: number | undefined = undefined, prefix = "offer"): Promise<string> {
  // big endian
  const chunks: Buffer[] = [];
  const spendnum = bundle.coin_spends.length;
  chunks.push(getUint32Buffer(spendnum));

  for (let i = 0; i < spendnum; i++) {
    const cs = bundle.coin_spends[i];
    const coin = cs.coin;
    chunks.push(Buffer.from(Bytes.from(coin.parent_coin_info, "hex").raw()));
    chunks.push(Buffer.from(Bytes.from(coin.puzzle_hash, "hex").raw()));
    chunks.push(getUint64Buffer(coin.amount));

    chunks.push(Buffer.from(assemble(await puzzle.disassemblePuzzle(cs.puzzle_reveal)).as_bin().raw()));
    chunks.push(Buffer.from(assemble(await puzzle.disassemblePuzzle(cs.solution)).as_bin().raw()));
  }

  chunks.push(Buffer.from(Bytes.from(bundle.aggregated_signature, "hex").raw()));

  const buff = Buffer.concat(chunks);

  ver = ver ?? initDict.length;

  const def = zlib.deflateSync(buff, { dictionary: getDictForVersion(ver) });

  const final_buff = Buffer.concat([getUint16Buffer(ver), def]);

  const encoded = bech32m.encode(prefix, bech32m.toWords(final_buff), false);
  return encoded;
}

function getUint16Buffer(number: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16BE(number);
  return buf;
}

function getUint32Buffer(number: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(number);
  return buf;
}

function getUint64Buffer(number: bigint): Buffer {
  const buf = Buffer.alloc(8);
  writeBigUInt64BE(buf, number);
  return buf;
}

// due to unknown `writeBigUInt64BE not a function` error, get following code from https://github.com/feross/buffer/blob/master/index.js#L1516
function writeBigUInt64BE(buf: Buffer, value: bigint, offset = 0) {
  return wrtBigUInt64BE(buf, value, offset)
}

function wrtBigUInt64BE(buf: Buffer, value: bigint, offset: number) {

  let lo = Number(value & BigInt(0xffffffff))
  buf[offset + 7] = lo
  lo = lo >> 8
  buf[offset + 6] = lo
  lo = lo >> 8
  buf[offset + 5] = lo
  lo = lo >> 8
  buf[offset + 4] = lo
  let hi = Number(value >> BigInt(32) & BigInt(0xffffffff))
  buf[offset + 3] = hi
  hi = hi >> 8
  buf[offset + 2] = hi
  hi = hi >> 8
  buf[offset + 1] = hi
  hi = hi >> 8
  buf[offset] = hi
  return offset + 8
}
