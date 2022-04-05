import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import { bech32m } from "@scure/base";
import zlib from 'zlib';
import { Buffer } from 'buffer';
import { Bytes, sexp_buffer_from_stream, Stream, sexp_from_stream, SExp } from "clvm";
import { prefix0x } from '@/services/coin/condition';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import puzzle from "../crypto/puzzle";

const initDict = [
  "ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ff02ffff01ff02ff5effff04ff02ffff04ffff04ff05ffff04ffff0bff2cff0580ffff04ff0bff80808080ffff04ffff02ff17ff2f80ffff04ff5fffff04ffff02ff2effff04ff02ffff04ff17ff80808080ffff04ffff0bff82027fff82057fff820b7f80ffff04ff81bfffff04ff82017fffff04ff8202ffffff04ff8205ffffff04ff820bffff80808080808080808080808080ffff04ffff01ffffffff81ca3dff46ff0233ffff3c04ff01ff0181cbffffff02ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff22ffff0bff2cff3480ffff0bff22ffff0bff22ffff0bff2cff5c80ff0980ffff0bff22ff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ff0bffff01ff02ffff03ffff09ffff02ff2effff04ff02ffff04ff13ff80808080ff820b9f80ffff01ff02ff26ffff04ff02ffff04ffff02ff13ffff04ff5fffff04ff17ffff04ff2fffff04ff81bfffff04ff82017fffff04ff1bff8080808080808080ffff04ff82017fff8080808080ffff01ff088080ff0180ffff01ff02ffff03ff17ffff01ff02ffff03ffff20ff81bf80ffff0182017fffff01ff088080ff0180ffff01ff088080ff018080ff0180ffff04ffff04ff05ff2780ffff04ffff10ff0bff5780ff778080ff02ffff03ff05ffff01ff02ffff03ffff09ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff01818f80ffff01ff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ffff04ff81b9ff82017980ff808080808080ffff01ff02ff5affff04ff02ffff04ffff02ffff03ffff09ff11ff7880ffff01ff04ff78ffff04ffff02ff36ffff04ff02ffff04ff13ffff04ff29ffff04ffff0bff2cff5b80ffff04ff2bff80808080808080ff398080ffff01ff02ffff03ffff09ff11ff2480ffff01ff04ff24ffff04ffff0bff20ff2980ff398080ffff010980ff018080ff0180ffff04ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff04ffff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ff17ff808080808080ff80808080808080ff0180ffff01ff04ff80ffff04ff80ff17808080ff0180ffffff02ffff03ff05ffff01ff04ff09ffff02ff26ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff0bff22ffff0bff2cff5880ffff0bff22ffff0bff22ffff0bff2cff5c80ff0580ffff0bff22ffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bff2cff058080ff0180ffff04ffff04ff28ffff04ff5fff808080ffff02ff7effff04ff02ffff04ffff04ffff04ff2fff0580ffff04ff5fff82017f8080ffff04ffff02ff7affff04ff02ffff04ff0bffff04ff05ffff01ff808080808080ffff04ff17ffff04ff81bfffff04ff82017fffff04ffff0bff8204ffffff02ff36ffff04ff02ffff04ff09ffff04ff820affffff04ffff0bff2cff2d80ffff04ff15ff80808080808080ff8216ff80ffff04ff8205ffffff04ff820bffff808080808080808080808080ff02ff2affff04ff02ffff04ff5fffff04ff3bffff04ffff02ffff03ff17ffff01ff09ff2dffff0bff27ffff02ff36ffff04ff02ffff04ff29ffff04ff57ffff04ffff0bff2cff81b980ffff04ff59ff80808080808080ff81b78080ff8080ff0180ffff04ff17ffff04ff05ffff04ff8202ffffff04ffff04ffff04ff24ffff04ffff0bff7cff2fff82017f80ff808080ffff04ffff04ff30ffff04ffff0bff81bfffff0bff7cff15ffff10ff82017fffff11ff8202dfff2b80ff8202ff808080ff808080ff138080ff80808080808080808080ff018080",
  "ff02ffff01ff02ff0affff04ff02ffff04ff03ff80808080ffff04ffff01ffff333effff02ffff03ff05ffff01ff04ffff04ff0cffff04ffff02ff1effff04ff02ffff04ff09ff80808080ff808080ffff02ff16ffff04ff02ffff04ff19ffff04ffff02ff0affff04ff02ffff04ff0dff80808080ff808080808080ff8080ff0180ffff02ffff03ff05ffff01ff04ffff04ff08ff0980ffff02ff16ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff1effff04ff02ffff04ff09ff80808080ffff02ff1effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080"]
  .map((t => Buffer.from(t, "hex")))

export async function decodeOffer(offerText: string): Promise<SpendBundle> {
  const offer_compressed = bech32m.decodeToBytes(offerText).bytes;
  const buff = Buffer.from(offer_compressed);

  const ver = buff.readUInt16BE(0);
  if (ver > initDict.length) throw new Error("error offer file version");

  const dict = function () {
    let b = Buffer.from([]);
    for (const r of initDict.slice(0, ver))
      b = Buffer.concat([b, r]);
    return b;
  }();

  const d = zlib.inflateSync(buff.slice(2), { dictionary: dict });

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

export async function encodeOffer(bundle: SpendBundle, prefix = "offer"): Promise<string> {
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

  const ver = 2;

  const dict = function () {
    let b = Buffer.from([]);
    for (const r of initDict.slice(0, ver))
      b = Buffer.concat([b, r]);
    return b;
  }();

  const def = zlib.deflateSync(buff, { dictionary: dict });

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
