import { getTestAccount } from "../utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateUpdatedNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";

import { cnsMetadata, knownCoins } from "./cns.test.data";
import { getCoinName0x, NetworkContext } from "@/services/coin/coinUtility";

import { assertSpendbundle } from "@/services/spendbundle/validator";
import { OriginCoin, signSpendBundle } from "@/services/spendbundle";
import { CnsBindingValues, CnsCoinAnalysisResult } from "@/models/nft";
import { expiryDate, mintOneCns } from "./functions";
import { AccountEntity } from "@/models/account";

const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
}
const availcoins: SymbolCoins = {
  [net.symbol]: [
    {
      "parent_coin_info": "0xc2d7aa805ebbfdfdd5760294b74ddd63c76cae14da817cd27e40ea2c15f18298",
      "puzzle_hash": "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155",
      "amount": 21n
    },
  ]
};

beforeAll(async () => {
  await Instance.init();
})

export async function initCnsCoin(
  fee: bigint,
  initBindings: CnsBindingValues
): Promise<[AccountEntity, OriginCoin, CnsCoinAnalysisResult]> {
  const target_hex = "0xd26c36cfd99da03a18a7d47dddd7beb968ff63bd7d3ccc45205fadb6958a571d";
  const initmd = Object.assign({}, cnsMetadata);
  initmd.name = "hiya.xch";
  initmd.bindings = initBindings;
  initmd.expiry = expiryDate();
  const mintsb = await mintOneCns(fee, initmd, net, [puzzle.getAddressFromPuzzleHash(target_hex, net.prefix)]);
  const nftcs = mintsb.coin_spends[2];

  const oanalysis = await analyzeNftCoin(nftcs.puzzle_reveal, "", nftcs.coin, nftcs.solution);
  if (oanalysis == null) fail("null analysis");
  if (!("cnsExpiry" in oanalysis)) fail("none-cns analysis");
  const analysis: CnsCoinAnalysisResult = oanalysis;
  expect(analysis).toMatchSnapshot("analysis");

  const nextCoin: OriginCoin = {
    parent_coin_info: getCoinName0x(nftcs.coin),
    amount: 1n,
    puzzle_hash: nftcs.coin.puzzle_hash,
  }
  knownCoins.push({
    parentCoinId: nextCoin.parent_coin_info,
    parentParentCoinId: nftcs.coin.parent_coin_info,
    amount: Number(nftcs.coin.amount),
    puzzleReveal: nftcs.puzzle_reveal,
  })

  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  account.addressRetrievalCount = 5;

  return [account, nextCoin, analysis];
}

export async function testUpdateCns(
  fee: bigint,
  account: AccountEntity,
  nextCoin: OriginCoin,
  analysis: CnsCoinAnalysisResult,
  updateBindings: CnsBindingValues,
): Promise<void> {
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const changeAddress = puzzle.getAddressFromPuzzleHash(change_hex, net.prefix);
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v1");

  const ubundle = await generateUpdatedNftBundle(
    changeAddress, fee, nextCoin, analysis, "CNS", "bindings", updateBindings, availcoins, tokenPuzzles, net);

  const finalCoin = ubundle.coin_spends[0];
  const finalAnalysis = await analyzeNftCoin(finalCoin.puzzle_reveal, analysis.p2Owner, finalCoin.coin, finalCoin.solution);
  if (finalAnalysis == null) fail("null finalAnalysis");
  expect(finalAnalysis).toMatchSnapshot("finalAnalysis");

  const spendBundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(spendBundle, net.chainId);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}

describe("Update CNS from empty", () => {
  let initData: [AccountEntity, OriginCoin, CnsCoinAnalysisResult] | undefined = undefined;
  beforeAll(async () => {
    initData = await initCnsCoin(0n, {});
  })

  test('1: to one address', async () => {
    const md: CnsBindingValues = {
      address: "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
    };
    if (!initData) fail("not init");
    const [account, nextCoin, analysis] = initData;
    await testUpdateCns(0n, account, nextCoin, analysis, md);
  });

  test('2: to full bindings', async () => {
    const md: CnsBindingValues = {
      address: "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10",
      did: "3a004a7c4e900167f0807ed53cbbe3c2ca66d0edbeba2fa243aa849d2babd909",// did:chia:18gqy5lzwjqqk0uyq0m2newlrct9xd58dh6azlgjr42zf62atmyys9hrt99
      publicKey: "59239f069f0dbe9db384f47f1fd82add572ad74f2148812100969c0ed90aaa72",// curve255191ty3e7p5lpklfmvuy73l3lkp2m4tj4460y9ygzggqj6wqakg24feqtfue8c
      text: "world hello",
    };
    if (!initData) fail("not init");
    const [account, nextCoin, analysis] = initData;
    await testUpdateCns(0n, account, nextCoin, analysis, md);
  });
});

describe("Update CNS from one address", () => {
  let initData: [AccountEntity, OriginCoin, CnsCoinAnalysisResult] | undefined = undefined;
  beforeAll(async () => {
    const initmd: CnsBindingValues = {
      address: "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10",
    };
    initData = await initCnsCoin(0n, initmd);
  })

  test('1: to another address', async () => {
    const md: CnsBindingValues = {
      address: "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
    };
    if (!initData) fail("not init");
    const [account, nextCoin, analysis] = initData;
    await testUpdateCns(0n, account, nextCoin, analysis, md);
  });
});
