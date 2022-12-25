import { CoinSpend, SpendBundle, UnsignedSpendBundle } from "../spendbundle";
import { Bytes, SExp, Tuple } from "clvm";
import { getNumber, Hex0x, prefix0x } from '../coin/condition';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import puzzle from "../crypto/puzzle";
import { modsdict, modsprog } from '../coin/mods';
import { uncurry } from 'clvm_tools/clvm_tools/curry';
import { ConditionOpcode } from "../coin/opcode";
import { TokenSpendPlan } from "../transfer/transfer";
import bigDecimal from "js-big-decimal";
import { CannotParsePuzzle, getModsPath, sexpAssemble, SimplePuzzle, simplifyPuzzle } from "../coin/analyzer";
import { parseMetadata } from "../coin/singleton";
import { analyzeNftCoin, getNftMetadataInfo, getScalarString } from "../coin/nft";
import { NftDetail } from "../crypto/receive";

export async function getOfferSummary(bundle: UnsignedSpendBundle | SpendBundle): Promise<OfferSummary> {

  const ocs = getOfferedCoins(bundle);
  const rcs = getRequestedCoins(bundle);
  const requested: OfferEntity[] = [];
  const offered: OfferEntity[] = [];

  const tryGetAssetId = async (puzzle_reveal: string): Promise<string> => {
    const { module, args } = await internalUncurry(puzzle_reveal);
    if (modsdict[module] == "cat_v2" || modsdict[module] == "cat_v1") {
      const assetId = args[1];
      return assetId;
    }

    return "";
  }

  const tryGetNftIdAndRoyaltyAndImage = async (puzzle_reveal: string): Promise<[string, number, string]> => {
    const puz = await simplifyPuzzle(assemble(puzzle_reveal), puzzle_reveal);
    const modpath = getModsPath(puz);
    if (modpath == "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),p2_delegated_puzzle_or_hidden_puzzle())))"
      || modpath == "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),settlement_payments())))") {
      const ss = ((puz as SimplePuzzle)?.args[0] as CannotParsePuzzle).raw;
      const roy = (((((puz as SimplePuzzle)//singleton_top_layer_v1_1
        ?.args[1] as SimplePuzzle)//nft_state_layer
        ?.args[3] as SimplePuzzle)//nft_ownership_layer
        ?.args[2] as SimplePuzzle)//nft_ownership_transfer_program_one_way_claim_with_royalties
        ?.args[2] as CannotParsePuzzle)
        ?.raw;
      const rawmeta = (((puz as SimplePuzzle)//singleton_top_layer_v1_1
        ?.args[1] as SimplePuzzle)//nft_state_layer
        ?.args[1] as CannotParsePuzzle)
        ?.raw;

      const parsed = parseMetadata(sexpAssemble(rawmeta));
      const metadata = getNftMetadataInfo(parsed);

      const rn = Number(getNumber(prefix0x(sexpAssemble(roy).atom?.hex() ?? "")));
      const launcherId = sexpAssemble(ss).rest().first().atom?.hex();
      if (!launcherId) return ["", -1, ""];
      return [prefix0x(launcherId), rn, getScalarString(metadata.imageUri) ?? ""];
    }

    return ["", -1, ""];
  }

  const getCoinEntities = async (coin: CoinSpend, type: "offer" | "request") => {
    const entities: OfferEntity[] = [];
    const puzzle_reveal = await puzzle.disassemblePuzzle(coin.puzzle_reveal);
    const solution = await puzzle.disassemblePuzzle(coin.solution);
    let result = "";
    let assetId = "";
    let nftId = "";
    let royalty = -1;
    let imageUri = "";
    if (type == "request") {
      if (modsdict[puzzle_reveal] == "settlement_payments") {
        result = await puzzle.calcPuzzleResult(modsprog["settlement_payments"], solution);
      }
      else {
        assetId = await tryGetAssetId(puzzle_reveal);
        if (!assetId) [nftId, royalty, imageUri] = await tryGetNftIdAndRoyaltyAndImage(puzzle_reveal);
        result = await puzzle.calcPuzzleResult(modsprog["settlement_payments"], solution);
      }
    } else if (type == "offer") {
      result = await puzzle.calcPuzzleResult(puzzle_reveal, solution);
      assetId = await tryGetAssetId(puzzle_reveal);
      if (!assetId) [nftId, royalty, imageUri] = await tryGetNftIdAndRoyaltyAndImage(puzzle_reveal);
    }
    else {
      throw new Error("not implement");
    }

    const conds = puzzle.parseConditions(result);
    for (let j = 0; j < conds.length; j++) {
      const cond = conds[j];
      if (cond.code == ConditionOpcode.CREATE_COIN) {
        const tgt = prefix0x(Bytes.from(((cond.args[2] && cond.args[2]?.length > 0) ? cond.args[2][0] : cond.args[0]) as Uint8Array).hex());
        const id = assetId ? assetId : nftId;
        const wraptgt = id ? prefix0x(Bytes.from(cond.args[0] as Uint8Array).hex()) : undefined;
        const analysis = await analyzeNftCoin(coin.puzzle_reveal, coin.coin.puzzle_hash, coin.coin, coin.solution);
        const nft_detail: NftDetail | undefined = !analysis ? undefined :
          {
            metadata: {
              uri: getScalarString(analysis.metadata.imageUri) ?? "",
              hash: analysis.metadata.imageHash ?? "",
            },
            hintPuzzle: coin.coin.puzzle_hash,
            coin: coin.coin,
            address: puzzle.getAddressFromPuzzleHash(analysis.launcherId, "nft"),
            analysis,
          };
        entities.push({
          id,
          amount: getNumber(prefix0x(Bytes.from(cond.args[1] as Uint8Array).hex())),
          target: tgt,
          cat_target: (assetId) ? wraptgt : undefined,
          nft_target: nftId ? wraptgt : undefined,
          nft_detail,
          royalty: (nftId && royalty != -1) ? royalty : undefined,
          nft_uri: imageUri,
          coin,
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

export async function internalUncurry(puz: string): Promise<UncurriedPuzzle> {
  const curried = assemble(puz);
  const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
  const mods = disassemble(mod);
  const argarr = Array.from(args.as_iter()).map(_ => disassemble(_ as SExp));
  return { module: mods, args: argarr };
}

const EmptyParent = "0x0000000000000000000000000000000000000000000000000000000000000000";

function getOfferedCoins(bundle: UnsignedSpendBundle | SpendBundle): CoinSpend[] {
  return bundle.coin_spends.filter(_ => _.coin.parent_coin_info != EmptyParent)
}
function getRequestedCoins(bundle: UnsignedSpendBundle | SpendBundle): CoinSpend[] {
  return bundle.coin_spends.filter(_ => _.coin.parent_coin_info == EmptyParent)
}

export function getOfferEntities(ents: OfferTokenAmount[], target: Hex0x, catIds: { [name: string]: string }, symbol: string): OfferEntity[] {
  return ents.map((_) => ({
    id: _.token == symbol ? "" : catIds[_.token],
    symbol: _.token,
    amount: getAmount(_.token, _.amount, symbol),
    target: target,
  }));
}

function getAmount(symbol: string, amount: string, tokenSymbol: string): bigint {
  const decimal = symbol == tokenSymbol ? 12 : 3;
  return BigInt(bigDecimal.multiply(amount, Math.pow(10, decimal)));
}

export interface UncurriedPuzzle {
  module: string;
  args: string[];
}

export interface OfferEntity {
  symbol?: string;
  id: string;
  amount: bigint;
  target?: Hex0x;
  cat_target?: Hex0x;
  nft_target?: Hex0x;
  nft_detail?: NftDetail;
  royalty?: number;
  nft_uri?: string;
  coin?: CoinSpend;
}

export interface OfferPlan {
  id: string;
  plan: TokenSpendPlan;
}

export interface OfferSummary {
  requested: OfferEntity[];
  offered: OfferEntity[];
}

export interface OfferTokenAmount {
  token: string;
  amount: string;
}

