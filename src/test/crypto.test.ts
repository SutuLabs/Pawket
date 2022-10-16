import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import transfer from "@/services/transfer/transfer";
import { getCoinName } from "@/services/coin/coinUtility";
import { Instance } from "@/services/util/instance";
import { analyzeDidCoin } from "@/services/coin/did";
import { convertToOriginCoin } from "@/models/wallet";
import { prefix0x } from "@/services/coin/condition";
import { analyzeNftCoin } from "@/services/coin/nft";
import { getSignMessage, signMessage, verifySignature } from "@/services/crypto/sign";
import { PrivateKey } from "@chiamine/bls-signatures";

import didcoin2 from "./cases/didcoin2.json"
import nftcoin6 from "./cases/nftcoin6.json"
import { ByteBase, CryptographyService, EcPrivateKey, EcPublicKey } from "@/services/crypto/encryption";

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

// ## Signing Verification
//
// verification from:
// 1. pk -> (synthetic pk, p2 owner puzzle hash)
// 2. signature
// 3. message for signing
// 4. NFT/DID/XCH -> p2 owner puzzle hash

// verification process:
// 1. (pk -> synthetic pk, signature, message) -> signature correctness
// 2. (pk, NFT/DID/XCH) -> (pk -> synthetic pk -> p2 owner puzzle hash, NFT/DID/XCH -> p2 owner puzzle hash) -> linkability correctness

test('Sign Message By XCH', async () => {
  const puzzleHash = "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10";

  const privkey = utility.fromHexString("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const requests = await puzzle.getPuzzleDetails(privkey, "xch", 0, 10);
  const sk = requests.find(_ => prefix0x(_.hash) == puzzleHash)?.privateKey;
  if (!sk) fail("cannot find sk");

  await signMessageTest(sk, "747769", puzzleHash);
});

test('Sign Message By DID', async () => {
  const analysis = await analyzeDidCoin(didcoin2.puzzle_reveal, "", convertToOriginCoin(didcoin2.coin), didcoin2.solution);
  if (!analysis) fail("cannot parse did coin");

  const privkey = utility.fromHexString("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const requests = await puzzle.getPuzzleDetails(privkey, "xch", 0, 10);
  const sk = requests.find(_ => prefix0x(_.hash) == analysis.hintPuzzle)?.privateKey;
  if (!sk) fail("cannot find sk");

  await signMessageTest(sk, "747769", analysis.hintPuzzle);
});

test('Sign Message By NFT', async () => {
  const analysis = await analyzeNftCoin(nftcoin6.puzzle_reveal, "", convertToOriginCoin(nftcoin6.coin), nftcoin6.solution);
  if (!analysis) fail("cannot parse nft coin");

  const privkey = utility.fromHexString("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const requests = await puzzle.getPuzzleDetails(privkey, "xch", 0, 10);
  const sk = requests.find(_ => _.hash == analysis.p2Owner)?.privateKey;
  if (!sk) fail("cannot find sk");

  await signMessageTest(sk, "747769", analysis.p2Owner);
});

async function signMessageTest(sk: PrivateKey, message: string, expectPuzzleHash: string): Promise<void> {
  const pk = utility.toHexString(sk.get_g1().serialize());

  const msg = await getSignMessage(message);
  expect(utility.toHexString(msg)).toMatchSnapshot("msg");

  const { signature, syntheticPublicKey } = signMessage(sk, msg);
  expect(signature).toMatchSnapshot("signature");
  expect(syntheticPublicKey).toMatchSnapshot("syntheticPublicKey");

  const v = verifySignature(pk, msg, signature);
  expect(v).toBeTruthy();

  const vp2owner = prefix0x(await puzzle.getPuzzleHash(pk));
  expect(vp2owner).toBe(prefix0x(expectPuzzleHash));
}

test('ECDH 1', async () => {
  await testEncryption("hello");
});

test('ECDH 2', async () => {
  await testEncryption(`
very long sentence with newline
very long sentence with newline
very long sentence with newline
very long sentence with newline
very long sentence with newline
very long sentence with newline
very long sentence with newline
very long sentence with newline
  `);
});

async function testEncryption(plaintext: string): Promise<void> {
  const ecc = new CryptographyService();

  const sk1 = EcPrivateKey.parse('1d1b65531bf3b0fc629fb4537b8bf4083bb72b532f1b571250b137ca6bb4dde3');
  const sk2 = EcPrivateKey.parse('3d0578e760b3abb55eee2a207f86610f49c909b0bed5f1775e7c2cc1efe0033b');
  if (!sk1 || !sk2) fail();

  const pk1 = ecc.getPublicKey(sk1);
  const pk2 = ecc.getPublicKey(sk2);
  expect(pk1.toHex()).toMatchSnapshot("pk1");
  expect(pk2.toHex()).toMatchSnapshot("pk2");

  const pk1Parse = EcPublicKey.parse(pk1.toHex());
  expect(pk1Parse).toStrictEqual(pk1);

  const ran = ByteBase.hexStringToByte('3d0578e760b3abb55eee2a207f86610f');

  const enc = await ecc.encrypt(plaintext, pk2, sk1, ran);
  const dec = await ecc.decrypt(enc, pk1, sk2);
  expect(dec).toBe(plaintext);
  expect(enc).toMatchSnapshot("encrypted");
  expect(dec).toMatchSnapshot("decrypted");
}
