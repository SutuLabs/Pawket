import { PrivateKey, G1Element, ModuleInstance } from "@chiamine/bls-signatures";
import { prefix0x, unprefix0x } from "../coin/condition";
import { Bytes } from "clvm";
import crypto from "./isoCrypto";
import { Instance } from "../util/instance";

type deriveCallback = (path: number[]) => PrivateKey;
type derivePkCallback = (path: number[]) => G1Element;

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

  derivePath(BLS: ModuleInstance, sk: PrivateKey, path: number[], hardened: boolean): PrivateKey {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      sk = hardened ? BLS.AugSchemeMPL.derive_child_sk(sk, p) : BLS.AugSchemeMPL.derive_child_sk_unhardened(sk, p);
    }
    return sk;
  }

  async derive(privateKey: Uint8Array, hardened = true): Promise<deriveCallback> {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return (path: number[]) => this.derivePath(BLS, sk, path, hardened);
  }

  derivePkPath(BLS: ModuleInstance, pk: G1Element, path: number[]): G1Element {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      pk =  BLS.AugSchemeMPL.derive_child_pk_unhardened(pk, p); 
    }
    return pk;
  }

  async derivePk(publicKey: Uint8Array): Promise<derivePkCallback> {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");
    const pk = BLS.G1Element.from_bytes(publicKey);
    return (path: number[]) => this.derivePkPath(BLS, pk, path);
  }

  async getPrivateKey(privateKey: Uint8Array): Promise<PrivateKey> {
    const BLS = Instance.BLS;
    if (!BLS) throw new Error("BLS not initialized");
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return sk;
  }

  public async purehash(data: string | ArrayBuffer): Promise<Uint8Array> {
    if (typeof data === "string") {
      const enc = new TextEncoder();
      return new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(data)));
    }
    else {
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

  public getRandom(length:number): Uint8Array {
    const seed = new Uint8Array(length);
    crypto.getRandomValues(seed);
    return seed;
  }
}

export default new Utility();

export function bytesToHex0x(bytes: Bytes): string {
  return prefix0x(bytes.hex());
}
