import { SecretKey, PublicKey, ModuleInstance } from "chia-wallet-sdk-bundle";
import utility from "./utility";
import { DEFAULT_HIDDEN_PUZZLE_HASH, GROUP_ORDER } from "../coin/consts";
import { prefix0x } from "../coin/condition";
import { SExp, Bytes, bigint_fromBytes, bigint_to_bytes } from "clvm";
import { sha256tree } from "clvm_tools";

export function signMessage(
  privateKey: SecretKey,
  message: string | Uint8Array
): { signature: string; syntheticPublicKey: string } {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  message = decodeMessage(message);
  const ssk = calculate_synthetic_secret_key(BLS, privateKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  const spk = prefix0x(utility.toHexString(ssk.publicKey().toBytes()));
  const sig = AugSchemeMPL.sign(ssk, message);
  const s = prefix0x(utility.toHexString(sig.toBytes()));
  return { signature: s, syntheticPublicKey: spk };
}

export function verifySignature(
  pubKey: string | PublicKey,
  message: string | Uint8Array,
  signature: string | Uint8Array
): boolean {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  message = decodeMessage(message);
  if (typeof pubKey == "string") pubKey = PublicKey.fromBytes(utility.fromHexString(pubKey));
  if (typeof signature == "string") signature = utility.fromHexString(signature);

  const spk = calculate_synthetic_public_key(BLS, pubKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  const v = AugSchemeMPL.verify(spk, message, Signature.fromBytes(signature));
  return v;
}

export async function getSignMessage(message: string): Promise<Uint8Array> {
  const left = SExp.to("Chia Signed Message");
  const program = left.cons(message);
  const hash = sha256tree(program).raw();
  return hash;
}

export function calculate_synthetic_secret_key(secret_key: SecretKey, hidden_puzzle_hash: Uint8Array): SecretKey {
  try {
    const secret_exponent = bigint_fromBytes(Bytes.from(secret_key.toBytes()), { signed: true });
    const public_key = secret_key.publicKey();
    const synthetic_offset = calculate_synthetic_offset(public_key.toBytes(), hidden_puzzle_hash);
    const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % GROUP_ORDER;
    const synthetic_secret_key = SecretKey.fromBytes(bigint_to_uint8array_padding(synthetic_secret_exponent));
    return synthetic_secret_key;
  } catch (error) {
    throw new Error("failed to calculate synthetic secret key, due to " + error);
  }
}

export function calculate_synthetic_public_key(
  BLS: ModuleInstance,
  public_key: PublicKey,
  hidden_puzzle_hash: Uint8Array
): PublicKey {
  const synthetic_offset = SecretKey.fromBytes(
    bigint_to_uint8array_padding(calculate_synthetic_offset(public_key.toBytes(), hidden_puzzle_hash)),
    true
  );

  return public_key.add(synthetic_offset.publicKey());
}

export function bigint_to_uint8array_padding(v: bigint, expectLength = 32): Uint8Array {
  const blob = bigint_to_bytes(v).raw();
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
  const blob = Bytes.SHA256(new Uint8Array([...public_key, ...hidden_puzzle_hash]));
  let offset = bigint_fromBytes(blob, { signed: true });
  while (offset < 0) offset += GROUP_ORDER;
  offset %= GROUP_ORDER;
  return offset;
}
