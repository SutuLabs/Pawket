import { PrivateKey, G1Element } from "@chiamine/bls-signatures";
import { Instance } from "../util/instance";
import transfer from "../transfer/transfer";
import utility from "./utility";
import { DEFAULT_HIDDEN_PUZZLE_HASH } from "../coin/consts";
import puzzle from "./puzzle";
import { prefix0x } from "../coin/condition";

export function signMessage(privateKey: PrivateKey, message: string | Uint8Array): { signature: string, syntheticPublicKey: string } {
  const BLS = Instance.BLS;
  if (!BLS) throw new Error("BLS not initialized");
  message = decodeMessage(message);
  const ssk = transfer.calculate_synthetic_secret_key(BLS, privateKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
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

  const spk = transfer.calculate_synthetic_public_key(BLS, pubKey, DEFAULT_HIDDEN_PUZZLE_HASH.raw());
  const v = BLS.AugSchemeMPL.verify(spk, message, BLS.G2Element.from_bytes(signature));
  return v;
}

export async function getSignMessage(message: string): Promise<Uint8Array> {
  const puz = `("Chia Signed Message" . "${message}")`;
  const hash = await puzzle.getPuzzleHashFromPuzzle(puz);
  return utility.fromHexString(hash);
}

function decodeMessage(message: string | Uint8Array): Uint8Array {
  if (typeof message == "string") {
    message = message.startsWith("0x")
      ? utility.fromHexString(message)
      : new TextEncoder().encode(message);
  }
  return message;
}