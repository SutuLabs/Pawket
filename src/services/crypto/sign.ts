import { PrivateKey, G1Element, ModuleInstance } from "@chiamine/bls-signatures";
import { Instance } from "../util/instance";
import utility from "./utility";
import { DEFAULT_HIDDEN_PUZZLE_HASH, GROUP_ORDER } from "../coin/consts";
import puzzle from "./puzzle";
import { prefix0x } from "../coin/condition";
import { Bytes, bigint_from_bytes, bigint_to_bytes } from "clvm";

export function signMessage(privateKey: PrivateKey, message: string | Uint8Array): { signature: string, syntheticPublicKey: string } {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  message = decodeMessage(message);
  const ssk = calculate_synthetic_secret_key(BLS, privateKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  const spk = prefix0x(utility.toHexString(ssk.get_g1().serialize()));
  const sig = BLS.AugSchemeMPL.sign(ssk, message);
  const s = prefix0x(utility.toHexString(sig.serialize()));
  return { signature: s, syntheticPublicKey: spk }
}

export function verifySignature(pubKey: string | G1Element, message: string | Uint8Array, signature: string | Uint8Array): boolean {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  message = decodeMessage(message);
  if (typeof pubKey == "string") pubKey = BLS.G1Element.from_bytes(utility.fromHexString(pubKey));
  if (typeof signature == "string") signature = utility.fromHexString(signature);

  const spk = calculate_synthetic_public_key(BLS, pubKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  const v = BLS.AugSchemeMPL.verify(spk, message, BLS.G2Element.from_bytes(signature));
  return v;
}

export async function getSignMessage(message: string): Promise<Uint8Array> {
  const puz = `("Chia Signed Message" . "${message}")`;
  const hash = await puzzle.getPuzzleHashFromPuzzle(puz);
  return utility.fromHexString(hash);
}

export function calculate_synthetic_secret_key(BLS: ModuleInstance, secret_key: PrivateKey, hidden_puzzle_hash: Uint8Array): PrivateKey {
  try {
    const secret_exponent = bigint_from_bytes(Bytes.from(secret_key.serialize()), { signed: true });
    const public_key = secret_key.get_g1();
    const synthetic_offset = calculate_synthetic_offset(public_key.serialize(), hidden_puzzle_hash);
    const synthetic_secret_exponent = (secret_exponent + synthetic_offset) % GROUP_ORDER
    const synthetic_secret_key = BLS.PrivateKey.from_bytes(bigint_to_uint8array_padding(synthetic_secret_exponent), true)
    return synthetic_secret_key;
  } catch (error) {
    throw new Error("failed to calculate synthetic secret key, due to " + error);
  }
}

export function calculate_synthetic_public_key(BLS: ModuleInstance, public_key: G1Element, hidden_puzzle_hash: Uint8Array): G1Element {
  const synthetic_offset = BLS.PrivateKey.from_bytes(bigint_to_uint8array_padding(
    calculate_synthetic_offset(public_key.serialize(), hidden_puzzle_hash)), true);

  return public_key.add(synthetic_offset.get_g1());
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
    message = message.startsWith("0x")
      ? utility.fromHexString(message)
      : new TextEncoder().encode(message);
  }
  return message;
}

export function calculate_synthetic_offset(public_key: Uint8Array, hidden_puzzle_hash: Uint8Array): bigint {
  const blob = Bytes.SHA256(new Uint8Array([...public_key, ...hidden_puzzle_hash]));
  let offset = bigint_from_bytes(blob, { signed: true })
  while (offset < 0) offset += GROUP_ORDER;
  offset %= GROUP_ORDER;
  return offset;
}