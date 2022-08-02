import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import transfer from "@/services/transfer/transfer";
import { getCoinName } from "@/services/coin/coinUtility";
import { Instance } from "@/services/util/instance";

beforeAll(async () => {
  await Instance.init();
})

test('Basic Cryptography', async () => {
  const hash = await utility.hash("test");
  expect(hash).toMatchSnapshot("hash");

  const privkey = utility.fromHexString("67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2");
  const sk = await utility.getPrivateKey(privkey);
  const masterprikey = utility.toHexString(sk.serialize());
  const masterpubkey = utility.toHexString(sk.get_g1().serialize());
  expect(masterprikey).toMatchSnapshot("masterprikey");
  expect(masterpubkey).toMatchSnapshot("masterpubkey");
  expect(sk.get_g1().get_fingerprint().toString()).toMatchSnapshot("fingerprint");

  const derive = await utility.derive(privkey, true);
  const farmerpubkey = utility.toHexString(derive([12381, 8444, 0, 0]).get_g1().serialize());
  expect(farmerpubkey).toMatchSnapshot("farmerpubkey");
  const poolpubkey = utility.toHexString(derive([12381, 8444, 1, 0]).get_g1().serialize());
  expect(poolpubkey).toMatchSnapshot("poolpubkey");
  const walletprikey = utility.toHexString(derive([12381, 8444, 2, 0]).serialize());
  expect(walletprikey).toMatchSnapshot("walletprikey");
  const walletpubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
  expect(walletpubkey).toMatchSnapshot("walletpubkey");

  const adr = await puzzle.getAddress(walletpubkey, "xch");
  expect(adr).toMatchSnapshot("address");
});

test('Puzzle Assemble', async () => {
  const gt1 = transfer.getDelegatedPuzzle([
    ["a", "b", "c"],
    ["d", "e", "f"],
  ]);
  expect(gt1).toMatchSnapshot();

  const gt2 = transfer.getDelegatedPuzzle([
    ["a", "b", "c"],
    ["d", "e", ["f", `"g"`], []],
  ]);
  expect(gt2).toMatchSnapshot();
});

test('Coin Name', async () => {
  const coinname = getCoinName({
    amount: 1000000000n,
    parent_coin_info: "0xcd299604b459e5ff20da17627d684ea143fc1b5b4165166943729d2d24305de8",
    puzzle_hash: "0x484aaab0cda1b0149df9adeddb0a5d28976ad259ff6173f4488cbc68f095eb79",
  });
  expect(coinname).toMatchSnapshot("coinname");
});