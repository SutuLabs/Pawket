import { UnsignedSpendBundle, combineSpendBundle, OriginCoin } from "../spendbundle";
import { SymbolCoins } from "../transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle } from "../coin/nft";
import puzzle from "../crypto/puzzle";
import { CnsMetadataValues } from "../../models/nft";
import { getCoinName0x, NetworkContext } from "../coin/coinUtility";
import receive, { TokenPuzzleDetail } from "../crypto/receive";
import { generateOfferPlan, generateNftOffer } from "./bundler";
import { prefix0x } from "../coin/condition";
import { GetParentPuzzleResponse } from "@/models/api";
import { OfferEntity } from "./summary";
import utility from "../crypto/utility";
import { Instance } from "../util/instance";

export async function generateMintCnsOffer(
  targetAddress: string,
  changeAddress: string,
  price: bigint,
  fee: bigint,
  metadata: CnsMetadataValues,
  availcoins: SymbolCoins,
  requests: TokenPuzzleDetail[],
  royaltyAddressHex: string,
  tradePricePercentage: number,
  net: NetworkContext,
  nonceHex: string | null = null,
  privateKey: string | undefined = undefined,
): Promise<UnsignedSpendBundle> {
  if (!metadata.expiry) throw new Error("Expiry date is mandatory for CNS.");
  if (!metadata.name) throw new Error("Name is mandatory for CNS.");

  const target_hex = prefix0x(puzzle.getPuzzleHashFromAddress(targetAddress));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(changeAddress));
  const reqs = [
    {
      "id": "",
      "symbol": net.symbol,
      "amount": price,
      "target": target_hex,
    }
  ];

  // generate temporary intermediate address
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS is not initialized.");
  const sk = privateKey ? privateKey : utility.toHexString(BLS.AugSchemeMPL.key_gen(utility.getRandom(64)).serialize());
  const puzzles = await receive.getAssetsRequestDetail(sk, 0, 1, [], {}, "any", net.symbol, "cat_v2");
  const ps = puzzles.filter(_ => _.symbol == net.symbol)[0].puzzles;
  const intermediateAddress = ps[0].address;
  requests.filter(_ => _.symbol == net.symbol)[0].puzzles.push(...ps);

  const spendBundle = await generateMintNftBundle(
    intermediateAddress, changeAddress, fee, metadata, availcoins, requests, royaltyAddressHex,
    tradePricePercentage, net, undefined, undefined, undefined, true);

  const nftcs = spendBundle.coin_spends[2];
  const analysis = await analyzeNftCoin(nftcs.puzzle_reveal, "", nftcs.coin, nftcs.solution);
  const nextCoin: OriginCoin = {
    parent_coin_info: getCoinName0x(nftcs.coin),
    amount: 1n,
    puzzle_hash: nftcs.coin.puzzle_hash,
  }
  const knownCoins: GetParentPuzzleResponse[] = [];
  knownCoins.push({
    parentCoinId: nextCoin.parent_coin_info,
    parentParentCoinId: nftcs.coin.parent_coin_info,
    amount: Number(nftcs.coin.amount),
    puzzleReveal: nftcs.puzzle_reveal,
  })
  if (!analysis) throw Error("failed to analysis nft");
  if ("cnsName" in analysis === false) throw Error("failed to analysis cns nft");

  const offs: OfferEntity[] = [
    {
      "id": analysis.launcherId,
      "amount": 0n,
      "royalty": analysis.tradePricePercentage,
      "nft_uri": "something unimportant"
    }
  ];

  const offplan = await generateOfferPlan(offs, change_hex, availcoins, 0n, net.symbol);
  const legacyApiCall = net.api;
  net.api = async function (parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
    const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
    if (resp) return resp;
    return await legacyApiCall(parentCoinId);
  };
  const offerBundle = await generateNftOffer(
    offplan, analysis, nextCoin, reqs, requests, net, nonceHex);

  const offerCombineBundle = combineSpendBundle(spendBundle, offerBundle);
  return offerCombineBundle;
}