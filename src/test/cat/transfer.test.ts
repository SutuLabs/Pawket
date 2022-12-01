import { GetParentPuzzleResponse } from "@/models/api";
import { OriginCoin, signSpendBundle } from "@/services/spendbundle";
import { NetworkContext } from "@/services/coin/coinUtility";
import { prefix0x } from "@/services/coin/condition";
import { assertSpendbundle } from "@/services/spendbundle/validator";
import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import transfer, { SymbolCoins } from "@/services/transfer/transfer";
import { Instance } from "@/services/util/instance";
import { knownCoins } from "./transfer.test.data";

const net: NetworkContext = {
  prefix: "xch",
  symbol: "XCH",
  chainId: "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb",
  api: localPuzzleApiCall,
}
function xchPrefix() { return net.prefix; }

beforeAll(async () => {
  await Instance.init();
})

test('Cat Transfer', async () => {
  const coin: OriginCoin = {
    amount: 1900n,
    parent_coin_info: "0xc37536f1f63b5cabfd37c46761c5436d699179dcb4a15eb8b0da9249b1083e62",
    puzzle_hash: "0xef4a4e574a85ac8eb90556795577aff351097c4aba8cc057ee0a9db334573c11",
  };
  const sk_hex = "55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f";
  const tgt_addr = await puzzle.getAddressFromPuzzleHash(
    "0x3eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc0",
    xchPrefix()
  );
  const change_addr = await puzzle.getAddressFromPuzzleHash(
    "0x1cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce",
    xchPrefix()
  );
  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(tgt_addr));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(change_addr));

  const assetId = "b3867458a6af107794a09b6083e3f0f05fbece0adae328f4df9ade53a60ca1b3";

  const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, xchPrefix(), 0, 5, "cat_v2");
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = await transfer.generateSpendPlan({ "CAT": [coin] }, [{ symbol: "CAT", address: tgt_hex, amount: 300n, memos: [tgt_hex] }], change_hex, 0n, net.symbol);
  expect(plan).toMatchSnapshot("plan");
  const obPuzzles = puzzle.getObserverPuzzles(puzzles);
  const ubundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles: obPuzzles }], [], net);
  const bundle = await signSpendBundle(ubundle, [{ symbol: "CAT", puzzles }], net.chainId)
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}

test('Cat Transfer2', async () => {
  const coin: OriginCoin = {
    amount: 1900n,
    parent_coin_info: "0xc37536f1f63b5cabfd37c46761c5436d699179dcb4a15eb8b0da9249b1083e62",
    puzzle_hash: "0xef4a4e574a85ac8eb90556795577aff351097c4aba8cc057ee0a9db334573c11",
  };

  const sk_hex = "55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f";
  const tgt_addr = await puzzle.getAddressFromPuzzleHash(
    "0x1cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce",
    xchPrefix()
  );
  const change_addr = await puzzle.getAddressFromPuzzleHash(
    "0xc467280169dfc93e7a14b98475641996966d4d3800f814a2baaeab14a96e3b40",
    xchPrefix()
  );

  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(tgt_addr));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(change_addr));

  const assetId = "b3867458a6af107794a09b6083e3f0f05fbece0adae328f4df9ade53a60ca1b3";
  const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, xchPrefix(), 0, 8, "cat_v2");
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = await transfer.generateSpendPlan({ "CAT": [coin] }, [{ symbol: "CAT", address: tgt_hex, amount: 300n, memos: [tgt_hex] }], change_hex, 0n, net.symbol);
  expect(plan).toMatchSnapshot("plan");
  const obPuzzles = puzzle.getObserverPuzzles(puzzles);
  const ubundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles: obPuzzles }], [], net);
  const bundle = await signSpendBundle(ubundle, [{ symbol: "CAT", puzzles }], net.chainId)
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
});

test('Multi Cat Coin Transfer', async () => {
  const availcoins: SymbolCoins = {
    "CAT":
      [
        {
          "amount": 400n,
          "parent_coin_info": "0xd8d3cc3b5eb16ceb040789b06fd28e4c679d302a1c38ab996bf31509c4f374fc",
          "puzzle_hash": "0xd239cf42e582663680287f882b82ee83d04f1d191e5cef72c5f50f812d0089a2"
        },
        {
          "amount": 500n,
          "parent_coin_info": "0x1d1cf9ee3157cec05dcf783f028293e9f64786af4f187990d7dddfd5ae86ded4",
          "puzzle_hash": "0xd239cf42e582663680287f882b82ee83d04f1d191e5cef72c5f50f812d0089a2"
        },
        {
          "amount": 1000n,
          "parent_coin_info": "0x12541d9ccba8140483b736a9cbffd3c06b8ccbf47694e0f18eeaa5823ad7e3a2",
          "puzzle_hash": "0x89885e02c57779e62e3dad86b02ac4cd70f612215f3fc99d2a375aad1dc46835"
        },

      ]
  };

  const sk_hex = "46815978e90da660427161c265b400831ee59f9aae9a40b449fbcd67ca140590";
  const tgt_addr = await puzzle.getAddressFromPuzzleHash(
    "0x1cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce",
    xchPrefix()
  );
  const change_addr = await puzzle.getAddressFromPuzzleHash(
    "0x83baea4313afa1a5b174d1afef81ac640688a3a0157c418536c06e2b556adc55 ",
    xchPrefix()
  );

  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(tgt_addr));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(change_addr));

  const assetId = "b3867458a6af107794a09b6083e3f0f05fbece0adae328f4df9ade53a60ca1b3";
  const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, xchPrefix(), 0, 8, "cat_v2");
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = await transfer.generateSpendPlan(availcoins, [{ symbol: "CAT", address: tgt_hex, amount: 1900n, memos: [tgt_hex] }], change_hex, 0n, net.symbol);
  expect(plan).toMatchSnapshot("plan");
  const obPuzzles = puzzle.getObserverPuzzles(puzzles);
  const ubundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles: obPuzzles }], [], net);
  const bundle = await signSpendBundle(ubundle, [{ symbol: "CAT", puzzles }], net.chainId)
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
});

test('Multi Cat Coin Transfer 2', async () => {
  const availcoins: SymbolCoins = {
    "CAT":
      [
        {
          "amount": 10000n,
          "parent_coin_info": "0x81897a91b03a746d8572f18c2680712aafcb6968770f193d460ab2b61725a619",
          "puzzle_hash": "0x939e513dec6ce57df629a34ed43d51acb71845fc1aacce02b7dc398a47b5edf2"
        },
        {
          "amount": 10000n,
          "parent_coin_info": "0xa8068263bd62250f3caa758b0cd8d9893fd243d52bdb75f46dc40158d4e8d8dd",
          "puzzle_hash": "0x939e513dec6ce57df629a34ed43d51acb71845fc1aacce02b7dc398a47b5edf2"
        },
        {
          "amount": 18700n,
          "parent_coin_info": "0x1538b9b30740a8cb6219ce02f3d7a42d5a416e27b0f14ef24a0258b16f7cc5e3",
          "puzzle_hash": "0x939e513dec6ce57df629a34ed43d51acb71845fc1aacce02b7dc398a47b5edf2"
        },
        {
          "amount": 30015n,
          "parent_coin_info": "0x1538b9b30740a8cb6219ce02f3d7a42d5a416e27b0f14ef24a0258b16f7cc5e3",
          "puzzle_hash": "0x6bdd60941501dd8f9c6ddc4fead2b97994c24bea339e573b6fa13e3fd79509c7"
        }
      ]
  };

  const sk_hex = "3a7272b31b6da4e7c97c7f2225e788d2f534bb99ca168ee11346a12fed761bab";
  const tgt_addr = await puzzle.getAddressFromPuzzleHash(
    "0x1cf63b7cc60279a1b0745e8f426585ee81d8da0cd2d92dd9b44e6efbd88d40ce",
    xchPrefix()
  );
  const change_addr = await puzzle.getAddressFromPuzzleHash(
    "0x83baea4313afa1a5b174d1afef81ac640688a3a0157c418536c06e2b556adc55 ",
    xchPrefix()
  );

  const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(tgt_addr));
  const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(change_addr));

  const assetId = "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b";
  const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, xchPrefix(), 0, 8, "cat_v2");
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = transfer.generateSpendPlan(availcoins, [{ symbol: "CAT", address: tgt_hex, amount: 60000n, memos: [tgt_hex] }], change_hex, 0n, net.symbol);
  expect(plan).toMatchSnapshot("plan");
  const obPuzzles = puzzle.getObserverPuzzles(puzzles);
  const ubundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles: obPuzzles }], [], net);
  const bundle = await signSpendBundle(ubundle, [{ symbol: "CAT", puzzles }], net.chainId)
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
});