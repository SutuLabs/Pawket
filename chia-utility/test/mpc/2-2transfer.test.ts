import {
  combineSpendBundleSignature,
  getMessagesToSign,
  OriginCoin,
  signMessages,
  signMessagesForAggregateKey,
} from "../../services/spendbundle";
import { NetworkContextWithOptionalApi } from "../../services/coin/coinUtility";
import { prefix0x } from "../../services/coin/condition";
import { assertSpendbundle } from "../../services/spendbundle/validator";
import puzzle from "../../services/crypto/puzzle";
import utility from "../../services/crypto/utility";
import transfer, { TransferTarget } from "../../services/transfer/transfer";
import { Instance } from "../../services/util/instance";
import { createFakeXchCoin, getObserverTestAccountWithPuzzles, getTestAccount, logBundle } from "../utility";
import { getAccountAddressDetails } from "../../services/util/account";
import {
  bigint_to_uint8array_padding,
  calculate_synthetic_offset,
  calculate_synthetic_secret_key,
} from "../../services/crypto/sign";
import { DEFAULT_HIDDEN_PUZZLE_HASH } from "../../services/coin/consts";
import { TokenPuzzleObserver } from "../../services/crypto/receive";

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
  const sk1 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000001")
  );
  const sk2 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000002")
  );

  const pk1 = sk1.get_g1();
  const pk2 = sk2.get_g1();

  const aggpk = pk1.add(pk2);
  console.log("aggpk", utility.toHexString(aggpk.serialize()));

  // const account = await getObserverTestAccountWithPuzzles(prefix0x(utility.toHexString(aggpk.serialize())));
  // const tokenPuzzles = account.observePuzzles;
  // if (!tokenPuzzles) assert.fail("didn't get the observer puzzles");
  // const p2Puzzle = account.observePuzzles?.at(0)?.puzzles.at(0)?.puzzle;
  // if (!p2Puzzle) assert.fail("cannot get p2Puzzle");
  // const aggpk1 = account.observePuzzles?.at(0)?.puzzles.at(0)?.pubKey;
  // if (!aggpk1) assert.fail("cannot get first aggpk");

  const synpk = await puzzle.getSyntheticKey(utility.toHexString(aggpk.serialize()));
  console.log("synpk", synpk);
  const p2Puzzle = puzzle.getPuzzle(synpk);

  const coins = [
    // await createFakeXchCoin(p2Puzzle, 1000n),
    // await createFakeXchCoin(p2Puzzle, 2000n),
    // await createFakeXchCoin(p2Puzzle, 3000n),
    await createFakeXchCoin(p2Puzzle, 30000n),
  ];
  const total = 1000n + 2000n + 3000n - fee - 1n;

  const tgt_hex = "0x87908e3f85bf4b55c7e7709915c2ce97a1e6ec1d227e54a04dbfee6862d546a5";
  const change_hex = "0x4f45877796d7a64e192bcc9f899afeedae391f71af3afd7e15a0792c049d23d3";

  const targets: TransferTarget[] = [{ symbol: net.symbol, address: tgt_hex, amount: total }];
  const plan = await transfer.generateSpendPlan({ [net.symbol]: coins }, targets, change_hex, fee, net.symbol);
  expect(plan).toMatchSnapshot("plan");

  const tokenPuzzles: TokenPuzzleObserver[] = [
    {
      symbol: xchSymbol(),
      puzzles: [
        {
          puzzle: p2Puzzle,
          pubKey: prefix0x(utility.toHexString(aggpk.serialize())),
          synPubKey: prefix0x(synpk),
          hash: await puzzle.getPuzzleHashFromPuzzle(p2Puzzle),
          address: "",
        },
      ],
    },
  ];

  const ubundle = await transfer.generateSpendBundleWithoutCat(plan, tokenPuzzles, [], net);
  const msgs = await getMessagesToSign(ubundle, tokenPuzzles, net.chainId);
  console.log("msgs", msgs);

  // const sig1 = await signMessagesForAggregateKey(msgs, await utility.getPublicKey(utility.fromHexString(aggpk)), sk1, true);
  // const sig2 = await signMessagesForAggregateKey(msgs, await utility.getPublicKey(utility.fromHexString(aggpk)), sk2, false);
  const sig1 = await signMessagesForAggregateKey(msgs, aggpk, sk1, true);
  const sig2 = await signMessagesForAggregateKey(msgs, aggpk, sk2, false);
  const bundle = await combineSpendBundleSignature(ubundle, [sig1, sig2]);
  logBundle(bundle);
  await assertSpendbundle(bundle, net.chainId);
  expect(bundle).toMatchSnapshot("bundle");
}

test("BLS signature aggregation case 1: naive aggregate", async () => {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  const sk1 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000001")
  );
  const sk2 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000002")
  );
  const msg = utility.fromHexString("0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001");

  const pk1 = sk1.get_g1();
  const pk2 = sk2.get_g1();

  const aggpk = pk1.add(pk2);

  //sign
  const sig1 = BLS.AugSchemeMPL.sign_prepend(sk1, msg, aggpk);
  const sig2 = BLS.AugSchemeMPL.sign_prepend(sk2, msg, aggpk);

  //aggregate
  const aggsig = BLS.AugSchemeMPL.aggregate([sig1, sig2]);

  //verify
  const v = BLS.AugSchemeMPL.aggregate_verify([aggpk], [msg], aggsig);
  expect(v).toBeTruthy();
});

test("BLS signature aggregation case 2: multi condition", async () => {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  const sk1 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000001")
  );
  const sk2 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000002")
  );
  const msg = utility.fromHexString("0xe3b0c44298fc1c149afbf4c8996fb92400000000000000000000000000000001");

  const pk1 = sk1.get_g1();
  const pk2 = sk2.get_g1();

  //sign
  const sig1 = BLS.AugSchemeMPL.sign(sk1, msg);
  const sig2 = BLS.AugSchemeMPL.sign(sk2, msg);

  //aggregate
  const aggsig = BLS.AugSchemeMPL.aggregate([sig1, sig2]);

  //verify
  const v = BLS.AugSchemeMPL.aggregate_verify([pk1, pk2], [msg, msg], aggsig);
  expect(v).toBeTruthy();
});

test("BLS signature aggregation case 3: synthetic key aggregate", async () => {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  const sk1 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000001")
  );
  const sk2 = await utility.getPrivateKey(
    utility.fromHexString("0x0000000000000000000000000000000000000000000000000000000000000002")
  );
  const msg = utility.fromHexString("0x4c6e38eb1ebd7128f3a26e76167dbc700dced469dbda7332b235f64907fec834");

  const pk1 = sk1.get_g1();
  const pk2 = sk2.get_g1();

  const aggpk = pk1.add(pk2);

  // const derive = await utility.derivePk(aggpk.serialize());
  // const daggpk = derive([12381, 8444, 2, 0]);

  // const derivesk1 = await utility.derive(sk1.serialize());
  // const dsk1 = derivesk1([12381, 8444, 2, 0]);

  // const derivesk2 = await utility.derive(sk2.serialize());
  // const dsk2 = derivesk2([12381, 8444, 2, 0]);

  // only the synpk is exposed in the blockchain
  const synpk = await utility.getPublicKey(
    utility.fromHexString(await puzzle.getSyntheticKey(utility.toHexString(aggpk.serialize())))
  );

  // sign
  const synsk = BLS.PrivateKey.from_bytes(
    bigint_to_uint8array_padding(calculate_synthetic_offset(aggpk.serialize(), DEFAULT_HIDDEN_PUZZLE_HASH.raw())),
    true
  );

  const synsig = BLS.AugSchemeMPL.sign_prepend(synsk, msg, synpk);
  const sig1 = BLS.AugSchemeMPL.sign_prepend(sk1, msg, synpk);
  const sig2 = BLS.AugSchemeMPL.sign_prepend(sk2, msg, synpk);

  // aggregate
  // const aggsig = BLS.AugSchemeMPL.aggregate([synsig, sig1, sig2]);
  const aggsig = BLS.AugSchemeMPL.aggregate([BLS.AugSchemeMPL.aggregate([synsig, sig1]), sig2]);

  // verify
  const v = BLS.AugSchemeMPL.aggregate_verify([synpk], [msg], aggsig);
  expect(v).toBeTruthy();

  // false case
  const aggsig2 = BLS.AugSchemeMPL.aggregate([sig1, sig2]);
  expect(BLS.AugSchemeMPL.aggregate_verify([synpk], [msg], aggsig2)).toBeFalsy();
});
