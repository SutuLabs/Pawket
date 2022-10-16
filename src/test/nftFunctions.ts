import { convertToOriginCoin } from "@/models/wallet";
import { getTestAccount } from "./utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle, generateTransferNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { getAccountAddressDetails } from "@/services/util/account";
import { DidCoinAnalysisResult } from "@/services/coin/did";

import nftcoin0 from "./cases/nftcoin0.json"

import { NftMetadataValues } from "@/models/nft";
import { didAnalysis, knownCoins } from "./cases/nft.test.data";
import { NetworkContext } from "@/services/coin/coinUtility";

const net: NetworkContext = {
  prefix: "txch",
  symbol: "TXCH",
  chainId: "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2",
  api: localPuzzleApiCall,
}
function xchPrefix() { return "txch"; }
function xchSymbol() { return "TXCH"; }
function tokenInfo() { return {}; }

export async function testMintNft(
  fee: bigint,
  metadata: NftMetadataValues | NftMetadataValues[],
  targetAddresses: string[] | undefined = undefined,
): Promise<void> {
  const targetAddress = "txch1p6mjpkgetll9j6ztv2cj64rer0n66wakypl4awfwpcd5pm9uz92s0xl0jd";
  const changeAddress = "txch1p6mjpkgetll9j6ztv2cj64rer0n66wakypl4awfwpcd5pm9uz92s0xl0jd";
  const royaltyAddressHex = "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";
  const tradePricePercentage = 500;

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
  const availcoins: SymbolCoins = {
    [xchSymbol()]: [
      {
        "amount": 4998999984n,
        "parent_coin_info": "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ]
  };
  const { spendBundle } = await generateMintNftBundle(
    targetAddress, changeAddress, fee, metadata, availcoins, tokenPuzzles, royaltyAddressHex,
    tradePricePercentage, net, didAnalysis,
    "00186eae4cd4a3ec609ca1a8c1cda8467e3cb7cbbbf91a523d12d31129d5f8d7", targetAddresses);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

export async function testTransferNft(fee: bigint, didAnalysis: DidCoinAnalysisResult | undefined = undefined): Promise<void> {
  const hintPuzzle = "8f972e809806a42ec005beb3019665bea4b3478c9582bf43708bb1c261916a51";
  const target_hex = "0xd26c36cfd99da03a18a7d47dddd7beb968ff63bd7d3ccc45205fadb6958a571d";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const nftCoin = convertToOriginCoin(nftcoin0.coin);

  const analysis = await analyzeNftCoin(nftcoin0.puzzle_reveal, hintPuzzle, nftCoin, nftcoin0.solution);
  if (analysis == null) fail("null analysis");
  expect(analysis).toMatchSnapshot("analysis");

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix());
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, xchPrefix());

  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
  const availcoins: SymbolCoins = {
    [xchSymbol()]: [
      {
        "amount": 4998999984n,
        "parent_coin_info": "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ]
  };

  const spendBundle = await generateTransferNftBundle(
    targetAddress, changeAddress, fee, nftCoin, analysis, availcoins, tokenPuzzles, net, didAnalysis);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
