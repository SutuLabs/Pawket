import puzzle from "../crypto/puzzle";
import utility from "../crypto/utility";
import transfer from "../transfer/transfer";
import { assert } from "./runner";
import { xchPrefix } from "@/store/modules/network";
import { getCoinName } from "../coin/coinUtility";

export async function testCryptography(): Promise<void> {
  const hash = await utility.hash("test");
  assert("9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08", hash);

  const privkey = utility.fromHexString("67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2");
  const sk = await utility.getPrivateKey(privkey);
  const masterprikey = utility.toHexString(sk.serialize());
  const masterpubkey = utility.toHexString(sk.get_g1().serialize());
  assert("67b3dcf5ba985f77b7bb78b3edfd7e501f4669a3530b74f2247256e38b0529e2", masterprikey);
  assert(
    "89d4ca795881dc192cf7e0bcf22528c3d7708f57aa644647ae2506cd10405dc528b36e450ab901675f7a6289a4335a22",
    masterpubkey
  );
  assert("2308828858", sk.get_g1().get_fingerprint().toString());

  const derive = await utility.derive(privkey, true);
  const farmerpubkey = utility.toHexString(derive([12381, 8444, 0, 0]).get_g1().serialize());
  assert(
    "99f181b1b30865339eea4e61172e64282ed1793022363f6635affbfb2aa2f4384ef10df47a445f92d685c7265488777e",
    farmerpubkey
  );
  const poolpubkey = utility.toHexString(derive([12381, 8444, 1, 0]).get_g1().serialize());
  assert("9896eb01246db07360b4caba1861a6d13c5be923e28a68ba8429d841c5dfa429e05ef639003793c4715a8be4578abe9e", poolpubkey);
  const walletprikey = utility.toHexString(derive([12381, 8444, 2, 0]).serialize());
  assert("0408d4c5e7c97af49dd5605db1907a231761c0cba816c778e74c8de24d0793cd", walletprikey);
  const walletpubkey = utility.toHexString(derive([12381, 8444, 2, 0]).get_g1().serialize());
  assert(
    "8b58921998b2337fd9d4a410e8bd11dfda435feb92dc3d6f3e111194b99a0391f39cf9b9534a44d154c9d7492400f36b",
    walletpubkey
  );
  // });
  if (xchPrefix() == "xch") {
    const adr = await puzzle.getAddress(walletpubkey, xchPrefix());
    assert("xch13akv0y3er0qvdjwzks2gm4ljj7qpynrh6rcsnwc6y0hyfgzdj89sr43zcp", adr);
  }
}

export async function testPuzzleAssemble(): Promise<void> {
  const gt1 = transfer.getDelegatedPuzzle([
    ["a", "b", "c"],
    ["d", "e", "f"],
  ]);
  assert(`(q (a b c) (d e f))`, gt1);

  const gt2 = transfer.getDelegatedPuzzle([
    ["a", "b", "c"],
    ["d", "e", ["f", `"g"`], []],
  ]);
  assert(`(q (a b c) (d e (f "g") ()))`, gt2);
}

export async function testCoinName(): Promise<void> {
  const coinname = getCoinName({
    amount: 1000000000n,
    parent_coin_info: "0xcd299604b459e5ff20da17627d684ea143fc1b5b4165166943729d2d24305de8",
    puzzle_hash: "0x484aaab0cda1b0149df9adeddb0a5d28976ad259ff6173f4488cbc68f095eb79",
  });
  assert("c62152493a6f3fbca7a918a8258e52f84c4e8aa286b8ebf1b0d5e5dda7fa7e6f", coinname);
}