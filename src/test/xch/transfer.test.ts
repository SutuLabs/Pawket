import { OriginCoin, signSpendBundle } from "@/services/spendbundle";
import { NetworkContextWithOptionalApi } from "@/services/coin/coinUtility";
import { prefix0x } from "@/services/coin/condition";
import { assertSpendbundle } from "@/services/spendbundle/validator";
import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import transfer from "@/services/transfer/transfer";
import { Instance } from "@/services/util/instance";

const net: NetworkContextWithOptionalApi = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
}
function xchPrefix() { return net.prefix; }
function xchSymbol() { return net.symbol; }

beforeAll(async () => {
  await Instance.init();
})

test('Standard Transfer', async () => {
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
  const plan = await transfer.generateSpendPlan({ [xchSymbol()]: [coin] }, [{ symbol: xchSymbol(), address: tgt_hex, amount: 1_000_000n, }], change_hex, 0n, xchSymbol());
  expect(plan).toMatchSnapshot("plan");
  const obPuzzles = puzzle.getObserverPuzzles(puzzles);
  expect(obPuzzles).toMatchSnapshot("observer puzzles");
  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, [{ symbol: xchSymbol(), puzzles: obPuzzles }], [], net);
  const bundle = await signSpendBundle(ubundle, [{ symbol: xchSymbol(), puzzles }], net.chainId)
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
});