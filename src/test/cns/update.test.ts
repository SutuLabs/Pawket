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
import { CnsCoinAnalysisResult } from "@/models/nft";
import { expiryDate, mintOneCns } from "./functions";

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

beforeAll(async () => {
  await Instance.init();
})

export async function testUpdateCns(fee: bigint): Promise<void> {
  const target_hex = "0xd26c36cfd99da03a18a7d47dddd7beb968ff63bd7d3ccc45205fadb6958a571d";// fake address
  const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const update_hex = "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71";

  const initmd = Object.assign({}, cnsMetadata);
  initmd.name = "hiya.xch";
  initmd.bindings = {};
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

  const md = Object.assign({}, analysis.metadata.bindings);
  md.address = update_hex;

  const ubundle = await generateUpdatedNftBundle(
    changeAddress, fee, nextCoin, analysis, "CNS", "bindings", md, availcoins, tokenPuzzles, net);

  const finalCoin = ubundle.coin_spends[0];
  const finalAnalysis = await analyzeNftCoin(finalCoin.puzzle_reveal, analysis.p2Owner, finalCoin.coin, finalCoin.solution);
  if (finalAnalysis == null) fail("null finalAnalysis");
  expect(finalAnalysis).toMatchSnapshot("finalAnalysis");

  const spendBundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(spendBundle, net.chainId);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

test('Update CNS', async () => {
  await testUpdateCns(0n);
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
