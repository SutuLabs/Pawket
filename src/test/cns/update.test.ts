import { getTestAccount } from "../utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { analyzeNftCoin, generateUpdatedNftBundle } from "@/services/coin/nft";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";

import { knownCoins } from "./cns.test.data";
import { convertToOriginCoin, NetworkContext } from "@/services/coin/coinUtility";

import cnscoin1 from "../cases/cnscoin1.json"
import { assertSpendbundle } from "@/services/spendbundle/validator";
import { signSpendBundle } from "@/services/spendbundle";

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

  const ubundle = await generateUpdatedNftBundle(
    changeAddress, fee, nftCoin, analysis, "CNS", "address", update_hex, availcoins, tokenPuzzles, net);

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
