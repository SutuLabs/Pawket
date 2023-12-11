import { getTestAccount } from "../utility";
import transfer, { SymbolCoins, TransferTarget } from "../../services/transfer/transfer";
import { getBootstrapSpendBundle } from "../../services/coin/nft";
import { GetParentPuzzleResponse } from "../../models/api";
import { Instance } from "../../services/util/instance";
import { getAccountAddressDetails } from "../../services/util/account";

import { NetworkContext } from "../../services/coin/coinUtility";

import { assertSpendbundle } from "../../services/spendbundle/validator";
import { signSpendBundle } from "../../services/spendbundle";
import { prefix0x } from "../../services/coin/condition";
import { sha256 } from "../../services/offer/bundler";

const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
};

async function localPuzzleApiCall(_parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  return undefined;
}

const availcoins: SymbolCoins = {
  [net.symbol]: [
    {
      amount: 23n,
      parent_coin_info: "0xc4badc175d119df8006fd8e96ad84c475e743275e70d6c16f43cf83fb75df021",
      puzzle_hash: "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10",
    },
    {
      amount: 4998999984n,
      parent_coin_info: "0xf3b7d6d4bdd80b99c539f7ca900288f5dc2ac8fb23559656e981761e90b2fe71",
      puzzle_hash: "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155",
    },
  ],
};
const target_hex = "0xb5a2ec2aa0138555d55007acb0eed8a1ddd2baabb4d2e4a92417f8394afb1285";
const change_hex = "0x0eb720d9195ffe59684b62b12d54791be7ad3bb6207f5eb92e0e1b40ecbc1155";
const service_hex = "0xd19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea";
const tick = "TODO";

beforeAll(async () => {
  await Instance.init();
});

const deployInscription = `{'p':'xchs','op':'deploy','tick':'${tick}','max':'21000000','lim':'1000'}`;
const mintInscription = `{'p':'xchs','op':'mint','tick':'${tick}','amt':'1000'}`;
const transferInscription = `{'p':'xchs','op':'transfer','tick':'${tick}','amt':'888'}`;
const hint = prefix0x(sha256(Buffer.from(`{'p':'xchs','tick':'${tick}'}`)));
const service_fee = 1000n;

test("inscription: deploy with fee 0", async () => deploy(0n));
test("inscription: deploy with fee 10", async () => deploy(10n));

async function deploy(fee: bigint): Promise<void> {
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v2");

  const memo = deployInscription;
  const tgts: TransferTarget[] = [
    { address: target_hex, amount: 1n, symbol: net.symbol, memos: [hint, memo] },
    { address: service_hex, amount: service_fee, symbol: net.symbol, memos: [] },
  ];
  const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, BigInt(fee), net.symbol);

  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, tokenPuzzles, [], net);
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("spendbundle");
}

test("inscription: transfer with fee 0", async () => transf(0n));
test("inscription: transfer with fee 10", async () => transf(10n));

async function transf(fee: bigint): Promise<void> {
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v2");

  const memo = transferInscription;
  const tgts: TransferTarget[] = [
    { address: target_hex, amount: 1n, symbol: net.symbol, memos: [hint, memo] },
    { address: service_hex, amount: service_fee, symbol: net.symbol, memos: [] },
  ];
  const plan = transfer.generateSpendPlan(availcoins, tgts, change_hex, BigInt(fee), net.symbol);

  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, tokenPuzzles, [], net);
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("spendbundle");
}

test.each([
  [0n, 1],
  [88n, 8],
  [10n, 1],
  [123n, 12],
])("inscription: mint with fee %p and count %p", async (fee: bigint, count: number) => {
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v2");

  const memo = mintInscription;
  const sk = "00186eae4cd4a3ec609ca1a8c1cda8467e3cb7cbbbf91a523d12d31129d5f8d7";
  const ms = Array(count).fill([hint, memo]);
  const init = count == 1 ? [[hint, memo]] : undefined;
  const etgts: TransferTarget[] = [{ address: service_hex, amount: service_fee, symbol: net.symbol, memos: [] }];

  const tp = tokenPuzzles;
  const ubundle = await getBootstrapSpendBundle(target_hex, change_hex, fee, availcoins, tp, count, net, sk, init, ms, etgts);
  const bundle = await signSpendBundle(ubundle, tokenPuzzles, net.chainId);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("spendbundle");
});
