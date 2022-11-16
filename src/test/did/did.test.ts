import { Instance } from "@/services/util/instance";
import { getTestAccount } from "../utility";
import { SymbolCoins } from "@/services/transfer/transfer";
import puzzle from "@/services/crypto/puzzle";
import { GetParentPuzzleResponse } from "@/models/api";
import { getAccountAddressDetails } from "@/services/util/account";
import { analyzeDidCoin, generateMintDidBundle } from "@/services/coin/did";

import didcoin1 from "../cases/didcoin1.json"
import { knownCoins } from "../nft/nft.test.data";
import { convertToOriginCoin, NetworkContext } from "@/services/coin/coinUtility";
import { assertSpendbundle } from "@/services/spendbundle/validator";
import { signSpendBundle } from "@/services/spendbundle";

function tokenInfo() { return {}; }
const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
}

beforeAll(async () => {
  await Instance.init();
})

async function testMintDid(fee: bigint): Promise<void> {
  const xchSymbol = "XCH";
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

  const ubundle = await generateMintDidBundle(targetAddress, changeAddress, fee, {}, availcoins, tokenPuzzles, net);
  const spendBundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(spendBundle, net.chainId);
  expect(spendBundle).toMatchSnapshot("spendbundle");
}

test('Mint Did 1', async () => { await testMintDid(0n); });
test('Mint Did 2', async () => { await testMintDid(6666n); });

test('Analyze Did', async () => {
  const hintPuzzle = "0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
  const analysis = await analyzeDidCoin(didcoin1.puzzle_reveal, hintPuzzle, convertToOriginCoin(didcoin1.coin), didcoin1.solution);
  expect(analysis).toMatchSnapshot("did analysis");
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}
