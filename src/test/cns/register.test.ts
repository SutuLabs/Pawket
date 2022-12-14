import { getTestAccount } from "../utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";

import { CnsMetadataValues } from "@/models/nft";
import { cnsMetadata, knownCoins } from "./cns.test.data";
import { CoinSpend, signSpendBundle } from "@/services/spendbundle";
import { combineOfferSpendBundle, generateNftOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { getOfferSummary } from "@/services/offer/summary";
import { generateMintCnsOffer } from "@/services/offer/cns";
import { NetworkContext } from "@/services/coin/coinUtility";
import { Hex, prefix0x } from "@/services/coin/condition";

import { assertSpendbundle } from "@/services/spendbundle/validator";
import { expiryDate, mintOneCns } from "./functions";

const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
}
function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }

beforeAll(async () => {
  await Instance.init();
})

test('Register CNS 1', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.bindings = {
    address: "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155",
  };
  md.expiry = expiryDate();
  await testMintCns(0n, md);
});

test('Register CNS 2: with all bindings data', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.bindings = {
    address: "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e",
    did: "3a004a7c4e900167f0807ed53cbbe3c2ca66d0edbeba2fa243aa849d2babd909",// did:chia:18gqy5lzwjqqk0uyq0m2newlrct9xd58dh6azlgjr42zf62atmyys9hrt99
    publicKey: "59239f069f0dbe9db384f47f1fd82add572ad74f2148812100969c0ed90aaa72",// curve255191ty3e7p5lpklfmvuy73l3lkp2m4tj4460y9ygzggqj6wqakg24feqtfue8c
    text: "hello world",
  };
  md.expiry = expiryDate();
  await testMintCns(0n, md);
});

test('Register CNS 3: with empty address', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.bindings = {};
  md.expiry = expiryDate();
  await testMintCns(0n, md);
});

test('Register CNS 4: with extra bindings data', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "hiya.xch";
  md.bindings = {
    address: "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e",
    did: "3a004a7c4e900167f0807ed53cbbe3c2ca66d0edbeba2fa243aa849d2babd909",// did:chia:18gqy5lzwjqqk0uyq0m2newlrct9xd58dh6azlgjr42zf62atmyys9hrt99
    publicKey: "59239f069f0dbe9db384f47f1fd82add572ad74f2148812100969c0ed90aaa72",// curve255191ty3e7p5lpklfmvuy73l3lkp2m4tj4460y9ygzggqj6wqakg24feqtfue8c
    text: "hello world",
    hello: "world",
    bitcoin: "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e",
  };
  md.expiry = expiryDate();
  // suppress warn of `Unknown CNS binding fields: hello,bitcoin`
  const spy = jest.spyOn(console, 'warn').mockImplementation();
  await testMintCns(0n, md);
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
});

async function testMintCns(
  fee: bigint,
  metadata: CnsMetadataValues,
  targetAddresses: string[] | undefined = undefined,
): Promise<void> {
  const spendBundle = await mintOneCns(fee, metadata, net, targetAddresses);
  await assertSpendbundle(spendBundle, net.chainId);
  expect(spendBundle).toMatchSnapshot("spendbundle");
  const cs = spendBundle.coin_spends[2];
  await testAnalyzeCnsCoin(cs, "");
}

test('Create CNS Offer And Accept', async () => {
  const md = Object.assign({}, cnsMetadata);
  if (!md.bindings) fail("undefined bindings");
  md.name = "hiya.xch";
  md.bindings.address = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  md.expiry = expiryDate();
  await testMintCnsAndOffer(0n, md, md.bindings.address);
});

test('Create CNS Offer And Accept 2: empty address binding', async () => {
  const md = Object.assign({}, cnsMetadata);
  md.name = "longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglon.xch";
  expect(md.name.length).toBe(63 + ".xch".length);
  md.expiry = expiryDate();
  await testMintCnsAndOffer(0n, md, "0x5662b49a357db4f05c2c141452b72fb91e7ec286e9b47d6c287210c63ae5cd3e");
});

async function testMintCnsAndOffer(
  fee: bigint,
  metadata: CnsMetadataValues,
  tgt_hex: Hex,
): Promise<void> {
  const target_hex = prefix0x(tgt_hex);
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

  const uofferBundle = await generateMintCnsOffer(
    targetAddress, changeAddress, 200n, 0n, metadata, availcoinsForMaker, tokenPuzzles,
    royaltyAddressHex, tradePricePercentage, net, nonce, intermediate_sk);

  // combine into one spendbundle
  const offerBundle = await signSpendBundle(uofferBundle, tokenPuzzles, net.chainId);

  const offerText = await encodeOffer(offerBundle, 4);
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
  const utakerBundle = await generateNftOffer(
    offplangen,
    analysis,
    undefined,
    revSummary.requested,
    tokenPuzzles,
    net,
    nonce
  );
  const takerBundle = await signSpendBundle(utakerBundle, tokenPuzzles, net.chainId);
  expect(takerBundle).toMatchSnapshot("takerBundle");
  const bundle = await combineOfferSpendBundle([makerBundle, takerBundle]);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("combined");
}

async function testAnalyzeCnsCoin(coin: CoinSpend, hintPuzzle: string): Promise<void> {
  const puzzle_reveal = coin.puzzle_reveal;
  const solution = coin.solution;
  const ret = await analyzeNftCoin(puzzle_reveal, hintPuzzle, coin.coin, solution);
  expect(ret).toMatchSnapshot("cns analysis result");
}

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
