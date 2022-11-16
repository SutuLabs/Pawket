import { getTestAccount } from "../utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import { getBootstrapSpendBundle } from "@/services/coin/nft";
import { GetParentPuzzleResponse } from "@/models/api";
import { Instance } from "@/services/util/instance";
import { getAccountAddressDetails } from "@/services/util/account";

import { knownCoins } from "./cns.test.data";
import { NetworkContext } from "@/services/coin/coinUtility";

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

  const ubundle = await getBootstrapSpendBundle(
    target_hex, change_hex, fee, availcoins, tokenPuzzles, count, net, sk);
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("spendbundle");
});


async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
