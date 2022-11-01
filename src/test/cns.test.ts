import { getTestAccount } from "./utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle, generateUpdatedNftBundle, getBootstrapSpendBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";

import { CnsMetadataValues } from "@/models/nft";
import { cnsMetadata, knownCoins } from "./cases/cns.test.data";
import { CoinSpend, convertToOriginCoin, SpendBundle } from "@/models/wallet";
import { combineSpendBundle, generateNftOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { getOfferSummary } from "@/services/offer/summary";
import { generateMintCnsOffer } from "@/services/offer/cns";
import { NetworkContext } from "@/services/coin/coinUtility";
import { prefix0x } from "@/services/coin/condition";

import cnscoin1 from "./cases/cnscoin1.json"

const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
}
function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }
function chainId() { return "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"; }
function tokenInfo() { return {}; }
function expiryDate() {
  const dt = new Date(2022, 9, 31, 16, 0, 0); // month have 1 offset, this 2022-10-31
  return Math.floor(dt.getTime() / 1000 - dt.getTimezoneOffset() * 60).toFixed(0);
}

beforeAll(async () => {
  await Instance.init();
})

test('Prepare CNS bootstrap coins', async () => {
  const fee = 0n;
  const availcoins: SymbolCoins = {
    [xchSymbol()]: [
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
  const count = 10;

  const target_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const sk = "00186eae4cd4a3ec609ca1a8c1cda8467e3cb7cbbbf91a523d12d31129d5f8d7";

  const spendBundle = await getBootstrapSpendBundle(
    target_hex, change_hex, fee, availcoins, tokenPuzzles, count, net, sk);
  expect(spendBundle).toMatchSnapshot("spendbundle");
});

test('Register CNS', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.address = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  md.expiry = expiryDate();
  await testMintCns(0n, md);
});

async function testMintCns(
  fee: bigint,
  metadata: CnsMetadataValues,
  targetAddresses: string[] | undefined = undefined,
): Promise<void> {
  const spendBundle = await mintOneCns(fee, metadata, targetAddresses);
  expect(spendBundle).toMatchSnapshot("spendbundle");
  const cs = spendBundle.coin_spends[2];
  await testAnalyzeCnsCoin(cs, "");
}

async function mintOneCns(
  fee: bigint,
  metadata: CnsMetadataValues,
  targetAddresses: string[] | undefined = undefined,
): Promise<SpendBundle> {
  const target_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix());
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, xchPrefix());

  const royaltyAddressHex = "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";
  const tradePricePercentage = 500;

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");

  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const availcoins: SymbolCoins = {
    [xchSymbol()]: [
      {
        "amount": 4998999984n,
        "parent_coin_info": "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ]
  };
  const sk = "00186eae4cd4a3ec609ca1a8c1cda8467e3cb7cbbbf91a523d12d31129d5f8d7";
  const { spendBundle } = await generateMintNftBundle(
    targetAddress, changeAddress, fee, metadata, availcoins, tokenPuzzles, royaltyAddressHex,
    tradePricePercentage, net, undefined, sk, targetAddresses, true);
  return spendBundle;
}

test('Create CNS Offer And Accept', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.address = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  md.expiry = expiryDate();
  await testMintCnsAndOffer(0n, md);
});

test('Create CNS Offer And Accept 2', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglon.xch";
  expect(md.name.length).toBe(63 + ".xch".length);
  md.address = "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e";
  md.expiry = expiryDate();
  await testMintCnsAndOffer(0n, md);
});

async function testMintCnsAndOffer(
  fee: bigint,
  metadata: CnsMetadataValues,
): Promise<void> {
  const target_hex = prefix0x(metadata.address || "");
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix());
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, xchPrefix());

  const nonce = "626f9cf141deefc2e77a56a4ef99996259e840dc4020eda31408cdd442a770d1"
  const intermediate_sk = "44475cb971933e4545efad1337f3d68bc53523d987412df233f3b905ed1c5b3f"
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const availcoinsForMaker: SymbolCoins = {
    [xchSymbol()]: [
      {
        "amount": 1n,
        "parent_coin_info": "0xc4badc175d119df8006fd8e96ad84c475e743275e70d6c16f43cf83fb75df021",
        "puzzle_hash": "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"
      },
    ],
  };
  const availcoinsForTaker: SymbolCoins = {
    [xchSymbol()]: [
      {
        "amount": 4998999984n,
        "parent_coin_info": "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155"
      },
    ],
  };

  const royaltyAddressHex = "7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";
  const tradePricePercentage = 500;

  const offerBundle = await generateMintCnsOffer(
    targetAddress, changeAddress, 200n, 0n, metadata, availcoinsForMaker, tokenPuzzles,
    royaltyAddressHex, tradePricePercentage, net, nonce, intermediate_sk);

  const offerText = await encodeOffer(offerBundle);
  expect(offerText).toMatchSnapshot("offer text");

  // for offer taker

  const makerBundle = await decodeOffer(offerText);
  expect(makerBundle).toStrictEqual(offerBundle);

  const summary = await getOfferSummary(makerBundle);
  expect(summary).toMatchSnapshot("summary");
  const revSummary = getReversePlan(summary, change_hex, {});
  expect(revSummary).toMatchSnapshot("revSummary");
  expect(fee).toMatchSnapshot("fee");
  const analysis = summary.offered[0].nft_detail?.analysis;
  if (!analysis) fail("failed to get analysis from summary");
  expect(analysis).toMatchSnapshot("cns analysis");

  const royalty_amount = (revSummary.offered[0].amount * BigInt(analysis.tradePricePercentage)) / BigInt(10000);
  expect(royalty_amount).toMatchSnapshot("royalty_amount");
  const offplangen = await generateOfferPlan(
    revSummary.offered,
    change_hex,
    availcoinsForTaker,
    fee,
    xchSymbol(),
    royalty_amount
  );
  expect(offplangen).toMatchSnapshot("offplangen");
  const takerBundle = await generateNftOffer(
    offplangen,
    analysis,
    undefined,
    revSummary.requested,
    tokenPuzzles,
    net,
    nonce
  );
  expect(takerBundle).toMatchSnapshot("takerBundle");
  const combined = await combineSpendBundle([makerBundle, takerBundle]);
  expect(combined).toMatchSnapshot("combined");
}

test('Analyze CNS', async () => {
  //
});

async function testAnalyzeCnsCoin(coin: CoinSpend, hintPuzzle: string): Promise<void> {
  const puzzle_reveal = coin.puzzle_reveal;
  const solution = coin.solution;
  const ret = await analyzeNftCoin(puzzle_reveal, hintPuzzle, coin.coin, solution);
  expect(ret).toMatchSnapshot("cns analysis result");
}

test('Transfer CNS', async () => {
  //
});

export async function testUpdateCns(fee: bigint): Promise<void> {
  const hintPuzzle = "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const update_hex = "0xd26c36cfd99da03a18a7d47dddd7beb968ff63bd7d3ccc45205fadb6958a571d";
  const nftCoin = convertToOriginCoin({
    "amount": 1,
    "parent_coin_info": "0x76f8a0a38e04a54a3f08a65bc5860efdd6a52b678060c9747329248a8b1ad0dd",
    "puzzle_hash": "0xe1d6b7f6088ec67185c53524be7ceeb02df71ed99cdd4f5af1e120c86a3091e4"
  });

  const analysis = await analyzeNftCoin(cnscoin1.puzzle_reveal, hintPuzzle, nftCoin, cnscoin1.solution);
  if (analysis == null) fail("null analysis");
  expect(analysis).toMatchSnapshot("analysis");

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  account.addressRetrievalCount = 5;

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix());

  const tokenPuzzles = await getAccountAddressDetails(account, [], tokenInfo(), xchPrefix(), xchSymbol(), undefined, "cat_v1");
  const availcoins: SymbolCoins = {
    [xchSymbol()]: [
      {
        "parent_coin_info": "0xc2d7aa805ebbfdfdd5760294b74ddd63c76cae14da817cd27e40ea2c15f18298",
        "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155",
        "amount": 21n
      },
    ]
  };

  const spendBundle = await generateUpdatedNftBundle(
    changeAddress, fee, nftCoin, analysis, "CNS", "address", update_hex, availcoins, tokenPuzzles, net);

  const finalCoin = spendBundle.coin_spends[0];
  const finalAnalysis = await analyzeNftCoin(finalCoin.puzzle_reveal, analysis.p2Owner, finalCoin.coin, finalCoin.solution);
  if (finalAnalysis == null) fail("null finalAnalysis");
  expect(finalAnalysis).toMatchSnapshot("finalAnalysis");

  expect(spendBundle).toMatchSnapshot("spendbundle");
}

test('Update CNS', async () => {
  await testUpdateCns(0n);
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
