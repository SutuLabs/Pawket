import { SpendBundle } from "@/models/wallet";
import { GetPuzzleApiCallback, SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { CnsMetadataValues } from "@/models/nft";
import { OriginCoin } from "@/models/wallet";
import { getCoinName0x, NetworkContext } from "../coin/coinUtility";
import { TokenPuzzleDetail } from "../crypto/receive";
import { generateOfferPlan, generateNftOffer } from "./bundler";
import { prefix0x } from "../coin/condition";
import { combineSpendBundlePure } from "../mint/cat";
import { GetParentPuzzleResponse } from "@/models/api";
import { OfferEntity } from "./summary";

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
): Promise<SpendBundle> {
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

  const { spendBundle } = await generateMintNftBundle(
    targetAddress, changeAddress, fee, metadata, availcoins, requests, royaltyAddressHex,
    tradePricePercentage, net, undefined);

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
      "amount": 1n,
      "royalty": analysis.tradePricePercentage,
      "nft_uri": "something unimportant"
    }
  ];

  const offplan = await generateOfferPlan(offs, change_hex, availcoins, 0n, net.symbol);
  net.api = async function (parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
    const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
    if (resp) return resp;
    return await net.api(parentCoinId);
  };
  const offerBundle = await generateNftOffer(
    offplan, analysis, nextCoin, reqs, requests, net, nonceHex);

  const offerCombineBundle = await combineSpendBundlePure(spendBundle, offerBundle);
  return offerCombineBundle;
}