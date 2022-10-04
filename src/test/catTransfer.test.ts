import { GetParentPuzzleResponse } from "@/models/api";
import { OriginCoin } from "@/models/wallet";
import { prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import transfer, { SymbolCoins } from "@/services/transfer/transfer";
import { Instance } from "@/services/util/instance";
import { knownCoins } from "./cases/catTransfer.test.data";

function xchPrefix() { return "xch"; }
function xchSymbol() { return "XCH"; }
function chainId() { return "ccd5bb71183532bff220ba46c268991a3ff07eb358e8255a65c30a2dce0e5fbb"; }

beforeAll(async () => {
  await Instance.init();
})

test('Cat Transfer', async () => {
  const coin: OriginCoin = {
    amount: 9799n,
    parent_coin_info: "0x979cea91ab150d99211b9e5705b088c7807aac849d494fecf0419a382fe361f7",
    puzzle_hash: "0xce8a53f46946e5c5e2aa835d700745d9be3879bc5f6a029a965b7663a5c1f74c",
  };
  const sk_hex = "40fbb0dad159776ed05afbaeac4f4fe1b975e93bf5e9dda9fbf4e375346d12a0";
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

  const assetId = "78ad32a8c9ea70f27d73e9306fc467bab2a6b15b30289791e37ab6e8612212b1";

  const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, xchPrefix(), 0, 5, "cat_v1");
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = await transfer.generateSpendPlan({ "CAT": [coin] }, [{ symbol: "CAT", address: tgt_hex, amount: 300n, memos: [tgt_hex] }], change_hex, 0n, xchSymbol());
  expect(plan).toMatchSnapshot("plan");
  const bundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles }], [], xchSymbol(), chainId(), localPuzzleApiCall);
  expect(bundle).toMatchSnapshot("bundle");
});

async function localPuzzleApiCall(parentCoinId: string): Promise<GetParentPuzzleResponse | undefined> {
  const resp = knownCoins.find(_ => _.parentCoinId == parentCoinId);
  return resp;
}

test('Cat Transfer2', async () => {
  const coin: OriginCoin = {
    amount: 100000000n,
    parent_coin_info: "0x5c4d6545eb708deb0b5e594403d7038f372c46f18eae853677d20f9a1ec2307d",
    puzzle_hash: "0x9a3e78995734c97d37e7d497098203117a19cefef1bbfe276bc7903f5e279e1d",
  };

  const sk_hex = "40fbb0dad159776ed05afbaeac4f4fe1b975e93bf5e9dda9fbf4e375346d12a0";
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

  const assetId = "6e1815ee33e943676ee437a42b7d239c0d0826902480e4c3781fee4b327e1b6b";
  const puzzles = await puzzle.getCatPuzzleDetails(utility.fromHexString(sk_hex), assetId, xchPrefix(), 0, 8, "cat_v1");
  expect(puzzles).toMatchSnapshot("puzzles");
  const plan = await transfer.generateSpendPlan({ "CAT": [coin] }, [{ symbol: "CAT", address: tgt_hex, amount: 300n, memos: [tgt_hex] }], change_hex, 0n, xchSymbol());
  expect(plan).toMatchSnapshot("plan");
  const bundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles }], [], xchSymbol(), chainId(), localPuzzleApiCall);
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
  const plan = await transfer.generateSpendPlan(availcoins, [{ symbol: "CAT", address: tgt_hex, amount: 1900n, memos: [tgt_hex] }], change_hex, 0n, xchSymbol());
  expect(plan).toMatchSnapshot("plan");
  const bundle = await transfer.generateSpendBundleIncludingCat(plan, [{ symbol: "CAT", puzzles }], [], xchSymbol(), chainId(), localPuzzleApiCall);
  expect(bundle).toMatchSnapshot("bundle");
});