import { combineSpendBundleSignature, getMessagesToSign, OriginCoin, signMessages } from "../../services/spendbundle";
import { NetworkContextWithOptionalApi } from "../../services/coin/coinUtility";
import { prefix0x } from "../../services/coin/condition";
import { assertSpendbundle } from "../../services/spendbundle/validator";
import puzzle from "../../services/crypto/puzzle";
import utility from "../../services/crypto/utility";
import transfer, { TransferTarget } from "../../services/transfer/transfer";
import { Instance } from "../../services/util/instance";
import { createFakeXchCoin, getTestAccount } from "../utility";
import { getAccountAddressDetails } from "../../services/util/account";

const net: NetworkContextWithOptionalApi = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
};
function xchPrefix() {
  return net.prefix;
}
function xchSymbol() {
  return net.symbol;
}

beforeAll(async () => {
  await Instance.init();
});

test("Standard Transfer", async () => {
  const coin: OriginCoin = {
    amount: BigInt(1750000000000),
    parent_coin_info: "0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001",
    puzzle_hash: "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3",
  };
  const sk_hex = "5c3b9b1062eaefd843d79d2b53856da31521ed7d1fe2a3ec48c71e654c4530e5";
  const tgt_addr = await puzzle.getAddressFromPuzzleHash(
    "0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5",
    xchPrefix()
  );
  const change_addr = await puzzle.getAddressFromPuzzleHash(
    "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3",
    xchPrefix()
  );
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(tgt_addr));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(change_addr));

  const puzzles = await puzzle.getPuzzleDetails(utility.fromHexString(sk_hex), "xch", 0, 5);
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = await transfer.generateSpendPlan(
    { [xchSymbol()]: [coin] },
    [{ symbol: xchSymbol(), address: tgt_hex, amount: 1_000_000n }],
    change_hex,
    0n,
    xchSymbol()
  );
  expect(plan).toMatchSnapshot("plan");
  const obPuzzles = puzzle.getObserverPuzzles(puzzles);
  expect(obPuzzles).toMatchSnapshot("observer puzzles");
  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, [{ symbol: xchSymbol(), puzzles: obPuzzles }], [], net);
  // const bundle = await signSpendBundle(ubundle, [{ symbol: xchSymbol(), puzzles }], net.chainId)
  const msgs = await getMessagesToSign(ubundle, [{ symbol: xchSymbol(), puzzles: obPuzzles }], net.chainId);
  const sig = await signMessages(msgs, [{ symbol: xchSymbol(), puzzles }]);
  const bundle = await combineSpendBundleSignature(ubundle, sig);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
});

test("Multiple Xch Transfer", async () => {
  await testTransfer(0n);
  await testTransfer(5n);
});

async function testTransfer(fee = 0n): Promise<void> {
  const account = getTestAccount("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const tokenPuzzles = await getAccountAddressDetails(account, [], {}, net.prefix, net.symbol, undefined, "cat_v2");
  const p2Puzzle = tokenPuzzles.at(0)?.puzzles.at(0)?.puzzle;
  if (!p2Puzzle) fail();
  const coins = [
    await createFakeXchCoin(p2Puzzle, 1000n),
    await createFakeXchCoin(p2Puzzle, 2000n),
    await createFakeXchCoin(p2Puzzle, 3000n),
  ];
  const total = 1000n + 2000n + 3000n - fee - 1n;

  const tgt_hex = "0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5";
  const change_hex = "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3";

  const targets: TransferTarget[] = [{ symbol: net.symbol, address: tgt_hex, amount: total }];
  const plan = await transfer.generateSpendPlan({ [net.symbol]: coins }, targets, change_hex, fee, net.symbol);
  expect(plan).toMatchSnapshot("plan");

  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, tokenPuzzles, [], net);
  const msgs = await getMessagesToSign(ubundle, tokenPuzzles, net.chainId);
  const sig = await signMessages(msgs, tokenPuzzles);
  const bundle = await combineSpendBundleSignature(ubundle, sig);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
}
