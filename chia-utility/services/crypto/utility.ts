import { SecretKey, PublicKey } from "chia-wallet-sdk-bundle";
import { unprefix0x } from "services/coin/condition";
import crypto from "./isoCrypto";

type deriveCallback = (path: number[]) => SecretKey;
type derivePkCallback = (path: number[]) => PublicKey;

class Utility {
  toHexString(byteArray: Uint8Array) {
    return Array.from(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
  }

  fromHexString(hexString: string | undefined): Uint8Array {
    hexString = unprefix0x(hexString);
    if (!hexString) return new Uint8Array();
    return new Uint8Array(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (<any>hexString).match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16))
    );
  }

  derivePath(sk: SecretKey, path: number[], hardened: boolean): SecretKey {
    if (hardened) return sk.deriveHardenedPath(path);
    return sk.deriveUnhardenedPath(path);
  }

  derive(privateKey: Uint8Array, hardened = true): deriveCallback {
    const sk = SecretKey.fromBytes(privateKey);
    return (path: number[]) => this.derivePath(sk, path, hardened);
  }

  derivePkPath(pk: PublicKey, path: number[]): PublicKey {
    return pk.deriveUnhardenedPath(path);
  }

  derivePk(publicKey: Uint8Array): derivePkCallback {
    const pk = PublicKey.fromBytes(publicKey);
    return (path: number[]) => this.derivePkPath(pk, path);
  }

  getPrivateKey(privateKey: Uint8Array): SecretKey {
    return SecretKey.fromBytes(privateKey);
  }

  getPublicKey(publicKey: Uint8Array): PublicKey {
    return PublicKey.fromBytes(publicKey);
  }

  public async purehash(data: string | ArrayBuffer): Promise<Uint8Array> {
    if (typeof data === "string") {
      const enc = new TextEncoder();
      return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(data)));
    } else {
      return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    }
  }

  public async hash(data: string): Promise<string> {
    return this.toHexString(await this.purehash(data));
  }

  public async getFileHash(f: File): Promise<string> {
    const buffer = await f.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return this.toHexString(new Uint8Array(hash));
  }

  public async strongHash(data: string, salt: string, iteration = 1024): Promise<string> {
    // const start = performance.now();
    const enc = new TextEncoder();
    let d = Uint8Array.from([...enc.encode(data), ...enc.encode(salt)]).buffer;
    for (let i = 0; i < iteration; i++) {
      d = await crypto.subtle.digest("SHA-256", d);
    }
    // const end = performance.now();
    // console.warn(`elapsed ${end - start}ms for ${iteration} iterations.`);
    return this.toHexString(new Uint8Array(d));
  }

  public getRandom(length: number): Uint8Array {
    const seed = new Uint8Array(length);
    crypto.getRandomValues(seed);
    return seed;
  }
}

export default new Utility();

export function bigint_from_bytes(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) {
    result = (result << 8n) | BigInt(byte);
  }
  return result;
}

export function bigint_to_bytes(value: bigint): Uint8Array {
  if (value < 0n) throw new Error("Only non-negative bigints supported");

  // special case: 0 -> [0]
  if (value === 0n) return new Uint8Array([0]);

  const bytes: number[] = [];
  while (value > 0n) {
    bytes.push(Number(value & 0xffn));
    value >>= 8n;
  }

  // bytes is in little-endian order (low byte first), which is often reversed to big-endian order
  return new Uint8Array(bytes.reverse());
}
