import store from "@/store";
import { PrivateKey, ModuleInstance } from "@chiamine/bls-signatures";

type deriveCallback = (path: number[]) => PrivateKey;

class Utility {

  toHexString(byteArray: Uint8Array) {
    return Array.from(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
  }

  fromHexString(hexString: string): Uint8Array {
    if (!hexString) return new Uint8Array();
    return new Uint8Array(
      (<any>hexString).match(/.{1,2}/g).map((byte: any) => parseInt(byte, 16))
    );
  }

  derivePath(BLS: ModuleInstance, sk: PrivateKey, path: number[], hardened: boolean): PrivateKey {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      sk = hardened
        ? BLS.AugSchemeMPL.derive_child_sk(sk, p)
        : BLS.AugSchemeMPL.derive_child_sk_unhardened(sk, p);

    }
    return sk;
  }

  async derive(privateKey: Uint8Array, hardened = true): Promise<deriveCallback> {
    const BLS = store.state.app.bls;
    if (!BLS) throw "BLS not initialized";
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return (path: number[]) => this.derivePath(BLS, sk, path, hardened);
  }

  async getPrivateKey(privateKey: Uint8Array): Promise<PrivateKey> {
    const BLS = store.state.app.bls;
    if (!BLS) throw "BLS not initialized";
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return sk;
  }
  public async purehash(data: string): Promise<Uint8Array> {
    const enc = new TextEncoder();
    return new Uint8Array(
      await crypto.subtle.digest("SHA-256", enc.encode(data))
    );
  }

  public async hash(data: string): Promise<string> {
    return this.toHexString(await this.purehash(data));
  }
}

export default new Utility();
