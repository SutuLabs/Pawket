import { getTestAccount } from "./utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateMintNftBundle, getBootstrapSpendBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";

import { CnsMetadataValues } from "@/models/nft";
import { cnsMetadata, knownCoins } from "./cases/cns.test.data";
import { CoinSpend } from "@/models/wallet";
import { combineSpendBundle, generateNftOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { getOfferSummary } from "@/services/offer/summary";
import { generateMintCnsOffer } from "@/services/offer/cns";

function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }
function chainId() { return "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"; }
function tokenInfo() { return {}; }

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
    target_hex, change_hex, fee, availcoins, tokenPuzzles, count, xchSymbol(), chainId(), sk);
  expect(spendBundle).toMatchSnapshot("spendbundle");
});

test('Register CNS', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.address = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  await testMintCns(0n, md);
});

async function testMintCns(
  fee: bigint,
  metadata: CnsMetadataValues,
  targetAddresses: string[] | undefined = undefined,
): Promise<void> {
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
    targetAddress, changeAddress, fee, metadata, availcoins, tokenPuzzles, xchSymbol(), chainId(), royaltyAddressHex,
    tradePricePercentage, undefined, localPuzzleApiCall, sk, targetAddresses);
  expect(spendBundle).toMatchSnapshot("spendbundle");
  const cs = spendBundle.coin_spends[2];
  await testAnalyzeCnsCoin(cs, "");
}

test('Create CNS Offer And Accept', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.address = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  await testMintCnsAndOffer(0n, md);
});

async function testMintCnsAndOffer(
  fee: bigint,
  metadata: CnsMetadataValues,
): Promise<void> {
  const target_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";

  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, xchPrefix());
  const targetAddress = puzzle.getAddressFromPuzzleHash(target_hex, xchPrefix());

  const nonce = "626f9cf141deefc2e77a56a4ef99996259e840dc4020eda31408cdd442a770d1"
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, xchPrefix(), xchSymbol(), undefined, "cat_v2");
  const availcoinsForMaker = {
    [xchSymbol()]: [
      {
        "amount": 1n,
        "parent_coin_info": "0xc4badc175d119df8006fd8e96ad84c475e743275e70d6c16f43cf83fb75df021",
        "puzzle_hash": "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"
      },
    ],
  };
  const availcoinsForTaker = {
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
    targetAddress, changeAddress, 200n, 0n, metadata, availcoinsForMaker, tokenPuzzles, xchSymbol(), chainId(),
    royaltyAddressHex, tradePricePercentage, localPuzzleApiCall, nonce);

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
    localPuzzleApiCall,
    xchSymbol(),
    chainId(),
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

test('Update CNS', async () => {
  //
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
