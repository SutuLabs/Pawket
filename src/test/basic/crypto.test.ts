import puzzle from "@/services/crypto/puzzle";
import utility from "@/services/crypto/utility";
import transfer from "@/services/transfer/transfer";
import { convertToOriginCoin, getCoinName } from "@/services/coin/coinUtility";
import { Instance } from "@/services/util/instance";
import { analyzeDidCoin } from "@/services/coin/did";
import { prefix0x } from "@/services/coin/condition";
import { analyzeNftCoin } from "@/services/coin/nft";
import { calculate_synthetic_secret_key, getSignMessage, signMessage, verifySignature } from "@/services/crypto/sign";
import { G2Element, PrivateKey } from "@chiamine/bls-signatures";

import didcoin2 from "../cases/didcoin2.json"
import nftcoin6 from "../cases/nftcoin6.json"
import { ByteBase, CryptographyService, EcPrivateKey, EcPublicKey } from "@/services/crypto/encryption";
import { EcdhHelper } from "@/services/crypto/ecdh";
import { getTestAccountWithPuzzles } from "../utility";
import { DEFAULT_HIDDEN_PUZZLE_HASH } from "@/services/coin/consts";

beforeAll(async () => {
  await Instance.init();
})

jest.setTimeout(30000);

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

test('BLS Aggregation', async () => {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");

  const sigs = [
    'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    'ac217e250273a881566563ffa4e296f7ed24ff6c44289b732875b67a0306766fd0e0675ec22cef94e5a7d349aba39ee103b33249be47c33a37698a5000fdda59b0bb39df89f74e6a457002ab5da32cafe24f7987e7722331736a9e2622c179d5',
  ].map(_ => BLS.G2Element.from_bytes(utility.fromHexString(_)));

  const serialize = (sig: G2Element | undefined): string => {
    if (!sig) return "";
    return utility.toHexString(sig.serialize());
  }
  const a1 = BLS.AugSchemeMPL.aggregate(sigs.slice(0, 1));
  const a2 = BLS.AugSchemeMPL.aggregate(sigs.slice(0, 2));
  const a3 = BLS.AugSchemeMPL.aggregate(sigs.slice(1, 2));
  const a4 = BLS.AugSchemeMPL.aggregate([a1, a3]);
  const a5 = BLS.AugSchemeMPL.aggregate([a1, a2]);
  const a8 = BLS.AugSchemeMPL.aggregate([a3]);
  expect(serialize(a1)).toBe(serialize(sigs.at(0)));
  expect(serialize(a2)).toBe(serialize(sigs.at(1)));
  expect(serialize(a3)).toBe(serialize(a2));
  expect(serialize(a4)).toBe(serialize(a2));
  expect(serialize(a5)).toBe(serialize(a2));
  expect(serialize(a8)).toBe(serialize(a2));

  const a6 = BLS.AugSchemeMPL.aggregate([a3, a2]);
  const a7 = BLS.AugSchemeMPL.aggregate([a2, a3]);

  expect(serialize(a6)).not.toBe(serialize(a2));
  expect(serialize(a6)).toMatchSnapshot();
  expect(serialize(a7)).toBe(serialize(a6));
});

test('BLS calculate_synthetic_secret_key', async () => {
  const ecdh = new EcdhHelper();
  const sk = "55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f";

  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");

  const synsk_noble_bls = ecdh.calculate_synthetic_secret_key(utility.fromHexString(sk), DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  const synsk_clvm_bls = calculate_synthetic_secret_key(BLS, BLS.PrivateKey.from_bytes(utility.fromHexString(sk), true), DEFAULT_HIDDEN_PUZZLE_HASH.raw()).serialize();

  expect(utility.toHexString(synsk_noble_bls)).toBe(utility.toHexString(synsk_clvm_bls));
});

test('BLS ECDH 1', async () => {
  await testBlsEcdh("hello");
});

test('BLS ECDH 2', async () => {
  await testBlsEcdh(`
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

async function testBlsEcdh(plaintext: string): Promise<void> {
  const ecdh = new EcdhHelper();

  const account1 = await getTestAccountWithPuzzles("55c335b84240f5a8c93b963e7ca5b868e0308974e09f751c7e5668964478008f");
  const account2 = await getTestAccountWithPuzzles("46815978e90da660427161c265b400831ee59f9aae9a40b449fbcd67ca140590");
  const ph1 = prefix0x(account1.addressPuzzles[0].puzzles[1].hash)
  const ph2 = prefix0x(account2.addressPuzzles[0].puzzles[1].hash)
  global.fetch = jest.fn().mockImplementation(mockFetch);
  const random = utility.fromHexString("b449fbcd67ca14059046815978e90da6");

  const enc = await ecdh.encrypt(ph1, ph2, plaintext, account1, "", random);
  expect(enc).toMatchSnapshot("encrypted");

  const dec = await ecdh.decrypt(ph1, ph2, enc, account2, "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (<any>global.fetch).mockClear();

  expect(dec).toBe(plaintext);
}

function mockFetch(url: RequestInfo, args: RequestInit): Promise<Response> {
  return Promise.resolve(<never>{
    ok: true,
    status: 200,
    json: async () => {
      if (url == "Wallet/records" && args.body == '{"puzzleHashes":["0x83baea4313afa1a5b174d1afef81ac640688a3a0157c418536c06e2b556adc55"],"includeSpentCoins":true,"hint":false}')
        return {
          "coins": [
            {
              "puzzleHash": "0x83baea4313afa1a5b174d1afef81ac640688a3a0157c418536c06e2b556adc55",
              "records": [
                {
                  "coin": {
                    "parentCoinInfo": "0xdfba5fd91f26eda808f74bdf8a753454c6f1e13a9bd9b1bc8040be64ec510e24",
                    "puzzleHash": "0x83baea4313afa1a5b174d1afef81ac640688a3a0157c418536c06e2b556adc55",
                    "amount": 100
                  },
                  "spent": true,
                }
              ]
            }
          ]
        };

      if (url == "Wallet/records" && args.body == '{"puzzleHashes":["0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10"],"includeSpentCoins":true,"hint":false}')
        return {
          "coins": [
            {
              "puzzleHash": "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10",
              "records": [
                {
                  "coin": {
                    "parentCoinInfo": "0x0068185e4f3a4217da08f1a04173f970d7f7f581e43f270ecc6c7260dd4bc38f",
                    "puzzleHash": "0x7ed1a136bdb4016e62922e690b897e85ee1970f1caf63c1cbe27e4e32f776d10",
                    "amount": 18
                  },
                  "spent": true,
                }
              ]
            }
          ]
        };

      if (url == "Wallet/get-puzzle" && args.body == '{"parentCoinId":"0xc20ab64698a0fc4dc1583b984c97eecb9f9348fb3343bfc5f5c94ee50bc05956"}')
        return {
          "parentCoinId": "0xc20ab64698a0fc4dc1583b984c97eecb9f9348fb3343bfc5f5c94ee50bc05956",
          "amount": 100,
          "parentParentCoinId": "0xdfba5fd91f26eda808f74bdf8a753454c6f1e13a9bd9b1bc8040be64ec510e24",
          "puzzleReveal": "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b0ae72dd3ae45995713c05bb674ebbfce59e68fdf7102b06cd6d38ebed11c12fe9bdec89ee4887e39382a4007f1d82b1f8ff018080"
        };

      if (url == "Wallet/get-puzzle" && args.body == '{"parentCoinId":"0x1718f1cc4aa62ace337f04208e62cbce178a3c0edec9f85638cf7c093129c450"}')
        return {
          "parentCoinId": "0x1718f1cc4aa62ace337f04208e62cbce178a3c0edec9f85638cf7c093129c450",
          "amount": 18,
          "parentParentCoinId": "0x0068185e4f3a4217da08f1a04173f970d7f7f581e43f270ecc6c7260dd4bc38f",
          "puzzleReveal": "0xff02ffff01ff02ffff01ff02ffff03ff0bffff01ff02ffff03ffff09ff05ffff1dff0bffff1effff0bff0bffff02ff06ffff04ff02ffff04ff17ff8080808080808080ffff01ff02ff17ff2f80ffff01ff088080ff0180ffff01ff04ffff04ff04ffff04ff05ffff04ffff02ff06ffff04ff02ffff04ff17ff80808080ff80808080ffff02ff17ff2f808080ff0180ffff04ffff01ff32ff02ffff03ffff07ff0580ffff01ff0bffff0102ffff02ff06ffff04ff02ffff04ff09ff80808080ffff02ff06ffff04ff02ffff04ff0dff8080808080ffff01ff0bffff0101ff058080ff0180ff018080ffff04ffff01b092c7027d455e843b1226b757c1dd5e124e0e6ddab3549036a4684b410182fdfd1eee459eb76a4d6d73e94f90fbe6eb1dff018080"
        };

      console.log("unexpect fetch url and args", url, args);
      return {};
    },
  });
}