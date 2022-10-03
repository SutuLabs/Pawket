import { convertToOriginCoin } from "@/models/wallet";
import { getTestAccount } from "./utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle, generateTransferNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";
import { analyzeDidCoin, generateMintDidBundle } from "@/services/coin/did";

import nftcoin0 from "./cases/nftcoin0.json"
import nftcoin1 from "./cases/nftcoin1.json"
import nftcoin2 from "./cases/nftcoin2.json"
import nftcoin3 from "./cases/nftcoin3.json"
import nftcoin4 from "./cases/nftcoin4.json"
import nftcoin5 from "./cases/nftcoin5.json"

import didcoin1 from "./cases/didcoin1.json"
import { NftMetadataValues } from "@/models/nft";
import { didAnalysis, knownCoins, nftMetadata } from "./cases/nft.test.data";

function xchPrefix() { return "txch"; }
function xchSymbol() { return "TXCH"; }
function chainId() { return "ae83525ba8d1dd3f09b277de18ca3e43fc0af20d20c4b3e92ef2a48bd291ccb2"; }
function tokenInfo() { return {}; }

beforeAll(async () => {
  await Instance.init();
})

async function testAnalyzeNftCoin(coin: any, hintPuzzle: string): Promise<void> {
  const puzzle_reveal = coin.puzzle_reveal;
  const solution = coin.solution;
  const ret = await analyzeNftCoin(puzzle_reveal, hintPuzzle, coin.coin, solution);
  expect(ret).toMatchSnapshot("nft analysis result");
}

// coin: 0x7daa37d920abd727414982a6e62cf79826f3973553dc4f1859fbdf25f4c425e6
test('Analyze Nft 1', async () => await testAnalyzeNftCoin(nftcoin1, "db308b6dcd4cd92a905934bc50d1e66f8788e876abe772c4c2b6bbe71e3b5f6f"));
// coin: 0x51a79ce606902e3b62074bcf43446bae24e3247d74bf1b993c70b78c2d1394c9
test('Analyze Nft 2', async () => await testAnalyzeNftCoin(nftcoin2, "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"));
// mainnet coin: 0x206fd290475e6c54eabc1216eec3f1ef4f8f66c0339fdf9275dd0e31a2ff8c75
test('Analyze Nft 3', async () => await testAnalyzeNftCoin(nftcoin3, "4c61cafe5965913de3655cc6a5015ec196a1cf8fe1652e2951245f4dac9e01c6"));

test('Analyze Nft 4', async () => await testAnalyzeNftCoin(nftcoin4, "0000000000000000000000000000000000000000000000000000000000000000"));
// mainnet coin: 0x092addccb83469b626b4a462e2b8671bb33085032486e9cf6861c43db188516b
test('Analyze Nft 5', async () => await testAnalyzeNftCoin(nftcoin5, "bae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79"));

async function testMintNft(
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
    targetAddress, changeAddress, fee, metadata, availcoins, tokenPuzzles, xchSymbol(), chainId(), royaltyAddressHex,
    tradePricePercentage, didAnalysis, localPuzzleApiCall,
    "00186eae4cd4a3ec609ca1a8c1cda8467e3cb7cbbbf91a523d12d31129d5f8d7", targetAddresses);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

test('Mint Nft', async () => {
  await testMintNft(0n, nftMetadata);
  await testMintNft(8889n, nftMetadata);
});

test('Mint Multiple Nfts', async () => {
  const metadatas = [
    Object.assign({}, nftMetadata, { serialNumber: 1 }),
    Object.assign({}, nftMetadata, { serialNumber: 2 }),
    Object.assign({}, nftMetadata, { serialNumber: 3 }),
  ];
  const addresses = [
    "xch1yrp82hk8q566lj9zkpqg637rp4r6rnsjxtxdxdusxrp62ymru2eq3l2ger",
    "xch12kr5c48vs65gugkn448j4djz95xqhxxjm05e0hfp7sze85rvsfns56p70d",
    "xch1mh5us8c296g4rvfhf4ksmnwzd66a9tzt9rslf3f4waejhyws7g6slnrxz6",
  ]
  await testMintNft(0n, metadatas);
  await testMintNft(8888n, metadatas, addresses);
});

async function testTransferNft(fee: bigint): Promise<void> {
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
    targetAddress, changeAddress, fee, nftCoin, analysis, availcoins, tokenPuzzles, xchSymbol(), chainId(), localPuzzleApiCall);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

test('Transfer Nft', async () => {
  await testTransferNft(0n);
  await testTransferNft(7777n);
});

async function testMintDid(fee: bigint): Promise<void> {
  const xchSymbol = "XCH";
  const chainId = "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb";
  const xchPrefix = "xch";
  const target_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix);
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, xchPrefix);

  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix, xchSymbol, undefined, "cat_v2");
  const availcoins: SymbolCoins = {
    [xchSymbol]: [
      {
        "amount": 23n,
        "parent_coin_info": "0xc4badc175d119df8006fd8e96ad84c475e743275e70d6c16f43cf83fb75df021",
        "puzzle_hash": "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"
      },
      {
        "amount": 4998999984n,
        "parent_coin_info": "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ]
  };

  const spendBundle = await generateMintDidBundle(targetAddress, changeAddress, fee, {}, availcoins, tokenPuzzles, xchSymbol, chainId);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

test('Mint Did', async () => {
  await testMintDid(0n);
  await testMintDid(6666n);
});

test('Analyze Did', async () => {
  const hintPuzzle = "0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const analysis = await analyzeDidCoin(didcoin1.puzzle_reveal, hintPuzzle, convertToOriginCoin(didcoin1.coin), didcoin1.solution);
  expect(analysis).toMatchSnapshot("did analysis");
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
