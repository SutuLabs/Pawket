import { SecretKey, PublicKey, Signature, fromHex, toHex, Program, Clvm, sha256 } from "chia-wallet-sdk-bundle";
import utility, { bigint_from_bytes, bigint_to_bytes } from "./utility";
import { DEFAULT_HIDDEN_PUZZLE_HASH, GROUP_ORDER } from "../coin/consts";
import { prefix0x } from "../coin/condition";
import { sha256tree } from "./clvm";

export function signMessage(
  privateKey: SecretKey,
  message: string | Uint8Array
): { signature: string; syntheticPublicKey: string } {
  message = decodeMessage(message);
  const ssk = calculate_synthetic_secret_key(privateKey, fromHex(DEFAULT_HIDDEN_PUZZLE_HASH));
  const spk = prefix0x(utility.toHexString(ssk.publicKey().toBytes()));
  const sig = ssk.sign(message);
  const s = prefix0x(utility.toHexString(sig.toBytes()));
  return { signature: s, syntheticPublicKey: spk };
}

export function verifySignature(
  pubKey: string | PublicKey,
  message: string | Uint8Array,
  signature: string | Uint8Array
): boolean {
  message = decodeMessage(message);
  if (typeof pubKey == "string") pubKey = PublicKey.fromBytes(utility.fromHexString(pubKey));
  if (typeof signature == "string") signature = utility.fromHexString(signature);

  const spk = calculate_synthetic_public_key(pubKey, fromHex(DEFAULT_HIDDEN_PUZZLE_HASH));
  const v = spk.verify(message, Signature.fromBytes(signature));
  return v;
}

export async function getSignMessage(message: string): Promise<Uint8Array> {
  const clvm = new Clvm();
  const left = clvm.alloc("Chia Signed Message");
  const program = clvm.pair(left, clvm.alloc(message));
  const hash = fromHex(sha256tree(program));
  return hash;
}

export function calculate_synthetic_secret_key(secret_key: SecretKey, hidden_puzzle_hash: Uint8Array): SecretKey {
  return secret_key.deriveSyntheticHidden(hidden_puzzle_hash);
  // try {
  //   const secret_exponent = bigint_fromBytes(Bytes.from(secret_key.toBytes()), { signed: true });
  //   const public_key = secret_key.publicKey();
  //   const synthetic_offset = calculate_synthetic_offset(public_key.toBytes(), hidden_puzzle_hash);
  //   const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % GROUP_ORDER;
  //   const synthetic_secret_key = SecretKey.fromBytes(bigint_to_uint8array_padding(synthetic_secret_exponent));
  //   return synthetic_secret_key;
  // } catch (error) {
  //   throw new Error("failed to calculate synthetic secret key, due to " + error);
  // }
}

export function calculate_synthetic_public_key(public_key: PublicKey, hidden_puzzle_hash: Uint8Array): PublicKey {
  return public_key.deriveSyntheticHidden(hidden_puzzle_hash);
  // const synthetic_offset = SecretKey.fromBytes(
  //   bigint_to_uint8array_padding(calculate_synthetic_offset(public_key.toBytes(), hidden_puzzle_hash)),
  // );

  // return public_key.add(synthetic_offset.publicKey());
}

export function bigint_to_uint8array_padding(v: bigint, expectLength = 32): Uint8Array {
  const blob = bigint_to_bytes(v);
  if (blob.length >= expectLength) return blob;

  const padded = new Uint8Array(expectLength);
  padded.set(blob, expectLength - blob.length);
  return padded;
}

function decodeMessage(message: string | Uint8Array): Uint8Array {
  if (typeof message == "string") {
    message = message.startsWith("0x") ? utility.fromHexString(message) : new TextEncoder().encode(message);
  }
  return message;
}

export function calculate_synthetic_offset(public_key: Uint8Array, hidden_puzzle_hash: Uint8Array): bigint {
  const blob = sha256(new Uint8Array([...public_key, ...hidden_puzzle_hash]));
  let offset = bigint_from_bytes(blob);
  while (offset < 0) offset += GROUP_ORDER;
  offset %= GROUP_ORDER;
  return offset;
}
