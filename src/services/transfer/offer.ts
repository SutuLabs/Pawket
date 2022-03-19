import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import { bech32m } from "@scure/base";
import zlib from 'zlib';
import { Buffer } from 'buffer';
import { Bytes, sexp_buffer_from_stream, Stream, sexp_from_stream, SExp, Tuple } from "clvm";
import { CoinConditions, ConditionType, prefix0x } from '@/services/coin/condition';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import puzzle from "../crypto/puzzle";
import { modsdict, modsprog } from '@/services/coin/mods';
import { uncurry } from 'clvm_tools/clvm_tools/curry';
import { ConditionOpcode } from "../coin/opcode";
import transfer, { GetPuzzleApiCallback, TokenSpendPlan } from "./transfer";
import { TokenPuzzleDetail } from "../crypto/receive";
import catBundle from "./catBundle";
import stdBundle from "./stdBundle";

class Offer {
  private initDict = [
    "ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ff02ffff01ff02ff5effff04ff02ffff04ffff04ff05ffff04ffff0bff2cff0580ffff04ff0bff80808080ffff04ffff02ff17ff2f80ffff04ff5fffff04ffff02ff2effff04ff02ffff04ff17ff80808080ffff04ffff0bff82027fff82057fff820b7f80ffff04ff81bfffff04ff82017fffff04ff8202ffffff04ff8205ffffff04ff820bffff80808080808080808080808080ffff04ffff01ffffffff81ca3dff46ff0233ffff3c04ff01ff0181cbffffff02ff02ffff03ff05ffff01ff02ff32ffff04ff02ffff04ff0dffff04ffff0bff22ffff0bff2cff3480ffff0bff22ffff0bff22ffff0bff2cff5c80ff0980ffff0bff22ff0bffff0bff2cff8080808080ff8080808080ffff010b80ff0180ffff02ffff03ff0bffff01ff02ffff03ffff09ffff02ff2effff04ff02ffff04ff13ff80808080ff820b9f80ffff01ff02ff26ffff04ff02ffff04ffff02ff13ffff04ff5fffff04ff17ffff04ff2fffff04ff81bfffff04ff82017fffff04ff1bff8080808080808080ffff04ff82017fff8080808080ffff01ff088080ff0180ffff01ff02ffff03ff17ffff01ff02ffff03ffff20ff81bf80ffff0182017fffff01ff088080ff0180ffff01ff088080ff018080ff0180ffff04ffff04ff05ff2780ffff04ffff10ff0bff5780ff778080ff02ffff03ff05ffff01ff02ffff03ffff09ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff01818f80ffff01ff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ffff04ff81b9ff82017980ff808080808080ffff01ff02ff5affff04ff02ffff04ffff02ffff03ffff09ff11ff7880ffff01ff04ff78ffff04ffff02ff36ffff04ff02ffff04ff13ffff04ff29ffff04ffff0bff2cff5b80ffff04ff2bff80808080808080ff398080ffff01ff02ffff03ffff09ff11ff2480ffff01ff04ff24ffff04ffff0bff20ff2980ff398080ffff010980ff018080ff0180ffff04ffff02ffff03ffff09ff11ff7880ffff0159ff8080ff0180ffff04ffff02ff7affff04ff02ffff04ff0dffff04ff0bffff04ff17ff808080808080ff80808080808080ff0180ffff01ff04ff80ffff04ff80ff17808080ff0180ffffff02ffff03ff05ffff01ff04ff09ffff02ff26ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff0bff22ffff0bff2cff5880ffff0bff22ffff0bff22ffff0bff2cff5c80ff0580ffff0bff22ffff02ff32ffff04ff02ffff04ff07ffff04ffff0bff2cff2c80ff8080808080ffff0bff2cff8080808080ffff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff2effff04ff02ffff04ff09ff80808080ffff02ff2effff04ff02ffff04ff0dff8080808080ffff01ff0bff2cff058080ff0180ffff04ffff04ff28ffff04ff5fff808080ffff02ff7effff04ff02ffff04ffff04ffff04ff2fff0580ffff04ff5fff82017f8080ffff04ffff02ff7affff04ff02ffff04ff0bffff04ff05ffff01ff808080808080ffff04ff17ffff04ff81bfffff04ff82017fffff04ffff0bff8204ffffff02ff36ffff04ff02ffff04ff09ffff04ff820affffff04ffff0bff2cff2d80ffff04ff15ff80808080808080ff8216ff80ffff04ff8205ffffff04ff820bffff808080808080808080808080ff02ff2affff04ff02ffff04ff5fffff04ff3bffff04ffff02ffff03ff17ffff01ff09ff2dffff0bff27ffff02ff36ffff04ff02ffff04ff29ffff04ff57ffff04ffff0bff2cff81b980ffff04ff59ff80808080808080ff81b78080ff8080ff0180ffff04ff17ffff04ff05ffff04ff8202ffffff04ffff04ffff04ff24ffff04ffff0bff7cff2fff82017f80ff808080ffff04ffff04ff30ffff04ffff0bff81bfffff0bff7cff15ffff10ff82017fffff11ff8202dfff2b80ff8202ff808080ff808080ff138080ff80808080808080808080ff018080",
    "ff02ffff01ff02ff0affff04ff02ffff04ff03ff80808080ffff04ffff01ffff333effff02ffff03ff05ffff01ff04ffff04ff0cffff04ffff02ff1effff04ff02ffff04ff09ff80808080ff808080ffff02ff16ffff04ff02ffff04ff19ffff04ffff02ff0affff04ff02ffff04ff0dff80808080ff808080808080ff8080ff0180ffff02ffff03ff05ffff01ff04ffff04ff08ff0980ffff02ff16ffff04ff02ffff04ff0dffff04ff0bff808080808080ffff010b80ff0180ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff1effff04ff02ffff04ff09ff80808080ffff02ff1effff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080"]
    .map((t => Buffer.from(t, "hex")))

  public async decode(offerText: string): Promise<SpendBundle> {
    const offer_compressed = bech32m.decodeToBytes(offerText).bytes;
    const buff = Buffer.from(offer_compressed);
    const initDict = this.initDict;

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

  public async encode(bundle: SpendBundle): Promise<string> {
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

    const initDict = this.initDict;

    const ver = 2;

    const dict = function () {
      let b = Buffer.from([]);
      for (const r of initDict.slice(0, ver))
        b = Buffer.concat([b, r]);
      return b;
    }();

    const def = zlib.deflateSync(buff, { dictionary: dict });

    const final_buff = Buffer.concat([getUint16Buffer(ver), def]);

    const encoded = bech32m.encode("offer", bech32m.toWords(final_buff), false);
    return encoded;
  }

  public async getSummary(bundle: SpendBundle): Promise<OfferSummary> {

    const ocs = this.getOfferedCoins(bundle);
    const rcs = this.getRequestedCoins(bundle);
    const requested: OfferEntity[] = [];
    const offered: OfferEntity[] = [];

    const tryGetAssetId = async (puzzle_reveal: string): Promise<string> => {
      const { module, args } = await this.uncurry(puzzle_reveal);
      if (modsdict[module] == "cat") {
        const assetId = args[1];
        return assetId;
      }

      return "";
    }

    const getCoinEntities = async (coin: CoinSpend, type: "offer" | "request") => {
      const entities: OfferEntity[] = [];
      const puzzle_reveal = await puzzle.disassemblePuzzle(coin.puzzle_reveal);
      const solution = await puzzle.disassemblePuzzle(coin.solution);
      let result = "";
      let assetId = "";
      if (type == "request") {
        if (modsdict[puzzle_reveal] == "settlement_payments") {
          result = await puzzle.calcPuzzleResult(modsprog["settlement_payments"], solution);
        }
        else {
          assetId = await tryGetAssetId(puzzle_reveal);
          result = await puzzle.calcPuzzleResult(modsprog["settlement_payments"], solution);
        }
      } else if (type == "offer") {
        result = await puzzle.calcPuzzleResult(puzzle_reveal, solution);
        assetId = await tryGetAssetId(puzzle_reveal);
      }
      else {
        throw "not implement"
      }

      const conds = puzzle.parseConditions(result);
      for (let j = 0; j < conds.length; j++) {
        const cond = conds[j];
        if (cond.code == ConditionOpcode.CREATE_COIN) {
          entities.push({
            id: assetId,
            amount: BigInt(prefix0x(Bytes.from(cond.args[1] as Uint8Array).hex())),
            target: prefix0x(Bytes.from(((cond.args[2] && cond.args[2]?.length > 0) ? cond.args[2][0] : cond.args[0]) as Uint8Array).hex()),
          })
        }
      }

      return entities;
    }

    for (let i = 0; i < ocs.length; i++) {
      const coin = ocs[i];
      offered.push(...(await getCoinEntities(coin, "offer")).filter(_ => _.target == "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79"));
    }

    for (let i = 0; i < rcs.length; i++) {
      const coin = rcs[i];
      requested.push(...await getCoinEntities(coin, "request"));
    }

    return { requested, offered };
  }

  public async generateOffer(
    offered: OfferPlan[],
    requested: OfferEntity[],
    puzzles: TokenPuzzleDetail[],
    nonceHex: string | null = null,
    getPuzzle: GetPuzzleApiCallback | null = null,
  ): Promise<SpendBundle> {
    if (offered.length != 1 || requested.length != 1) throw new Error("currently, only support single offer/request");
    if (offered[0].id && offered[0].plan.coins.length != 1) throw new Error("currently, only support single coin for CAT");

    const settlement_tgt = "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79";
    const cat_settlement_tgt = "0xdf4ec566122b8507fc920d03b04d7021909d5bcd58beed99710ba9bea58f970b";
    const spends: CoinSpend[] = [];
    const puz_anno_msgs: Uint8Array[] = [];
    const getNonce = () => {
      const nonceArr = new Uint8Array(256 / 8);
      crypto.getRandomValues(nonceArr)
      return Bytes.from(nonceArr).hex();
    }
    const nonce = nonceHex ?? getNonce();
    // console.log("nonce=",nonce)
    const getPuzAnnoMsg = async (puz: string, solution: string): Promise<Uint8Array> => {
      const output = await puzzle.calcPuzzleResult(puz, solution);
      const conds = puzzle.parseConditions(output);
      const cannos = conds.filter(_ => _.code == ConditionOpcode.CREATE_PUZZLE_ANNOUNCEMENT);
      if (cannos.length != 1) throw new Error("Unexpected result of create puzzle");
      const canno = cannos[0];
      return canno.args[0] as Uint8Array;
    };
    // generate requested
    for (let i = 0; i < requested.length; i++) {
      const req = requested[i];
      if (!req.id) {// XCH
        const coin = {
          parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
          puzzle_hash: settlement_tgt,
          amount: 0n,
        };

        const puzzle_reveal_text = puzzle.getSettlementPaymentsPuzzle();

        // put special target into puzzle reverse dict
        puzzles.filter(_ => _.symbol == "XCH")[0].puzzles.push({
          privateKey: puzzle.getEmptyPrivateKey(), // this private key will not really calculated due to no AGG_SIG_ME exist in this spend
          puzzle: puzzle_reveal_text,
          hash: settlement_tgt,
          address: "",
        })

        const solution_text = `((${prefix0x(nonce)} (${prefix0x(req.target)} ${req.amount} ())))`;
        const msg = await getPuzAnnoMsg(puzzle_reveal_text, solution_text);
        puz_anno_msgs.push(msg);

        const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puzzle_reveal_text));
        const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

        spends.push({ coin, solution, puzzle_reveal })
      }
      else {
        if (!req.symbol) throw new Error("symbol cannot be empty.");

        const coin = {
          parent_coin_info: "0x0000000000000000000000000000000000000000000000000000000000000000",
          puzzle_hash: cat_settlement_tgt,
          amount: 0n,
        };

        const puzzle_reveal_text = puzzle.getCatSettlementPuzzle(req.id);

        // put special target into puzzle reverse dict
        puzzles.filter(_ => _.symbol == req.symbol)[0].puzzles.push({
          privateKey: puzzle.getEmptyPrivateKey(), // this private key will not really calculated due to no AGG_SIG_ME exist in this spend
          puzzle: puzzle_reveal_text,
          hash: cat_settlement_tgt,
          address: "",
        })

        const solution_text = `((${prefix0x(nonce)} (${prefix0x(req.target)} ${req.amount} (${prefix0x(req.target)}))))`;
        const msg = await getPuzAnnoMsg(puzzle.getSettlementPaymentsPuzzle(), solution_text);
        puz_anno_msgs.push(msg);

        const puzzle_reveal = prefix0x(await puzzle.encodePuzzle(puzzle_reveal_text));
        const solution = prefix0x(await puzzle.encodePuzzle(solution_text));

        spends.push({ coin, solution, puzzle_reveal });
      }
    }

    if (puz_anno_msgs.length != 1) throw new Error("unexpected puzzle annocement message number");

    // genreate offered
    const getPuzzleAnnoConditions = (coin_puzzle_hash: string): ConditionType[] => {
      const conds: ConditionType[] = [];
      for (let k = 0; k < puz_anno_msgs.length; k++) {
        const msg = puz_anno_msgs[k];
        const puz_anno_id = this.sha256(coin_puzzle_hash, msg);
        conds.push(CoinConditions.ASSERT_PUZZLE_ANNOUNCEMENT(puz_anno_id));
      }
      return conds;
    }

    for (let i = 0; i < offered.length; i++) {
      const off = offered[i];
      if (off.id) {//CAT
        for (let j = 0; j < off.plan.coins.length; j++) {
          const coin = off.plan.coins[j];
          const conds = getPuzzleAnnoConditions(coin.puzzle_hash);

          const css = await catBundle.generateCoinSpends(off.plan, puzzles, conds, getPuzzle);
          spends.push(...css);
        }
      } else {
        for (let j = 0; j < off.plan.coins.length; j++) {
          const coin = off.plan.coins[j];
          const conds = getPuzzleAnnoConditions(coin.puzzle_hash);

          const css = await stdBundle.generateCoinSpends(off.plan, puzzles, conds);
          spends.push(...css);
        }
      }
    }

    // combine into one spendbundle
    return transfer.getSpendBundle(spends, puzzles);
  }

  public sha256(...args: (string | Uint8Array)[]): string {
    const cont = new Uint8Array(args.map(_ => Bytes.from(_, "hex").raw()).reduce((acc, cur) => [...acc, ...cur], [] as number[]));
    const result = Bytes.SHA256(cont);
    return prefix0x(result.hex());
  }

  private async uncurry(puz: string): Promise<UncurriedPuzzle> {
    const curried = assemble(puz);
    const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
    const mods = disassemble(mod);
    const argarr = Array.from(args.as_iter()).map(_ => disassemble(_ as SExp));
    return { module: mods, args: argarr };
  }

  private readonly EmptyParent = "0x0000000000000000000000000000000000000000000000000000000000000000";

  private getOfferedCoins(bundle: SpendBundle): CoinSpend[] {
    return bundle.coin_spends.filter(_ => _.coin.parent_coin_info != this.EmptyParent)
  }
  private getRequestedCoins(bundle: SpendBundle): CoinSpend[] {
    return bundle.coin_spends.filter(_ => _.coin.parent_coin_info == this.EmptyParent)
  }
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

export interface UncurriedPuzzle {
  module: string;
  args: string[];
}

export interface OfferEntity {
  symbol?: string;
  id: string;
  amount: bigint;
  target: string;
}

export interface OfferPlan {
  id: string;
  plan: TokenSpendPlan;
}

export interface OfferSummary {
  requested: OfferEntity[];
  offered: OfferEntity[];
}

export default new Offer();
