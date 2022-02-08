import loadBls from "@chiamine/bls-signatures";
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

  derivePath(BLS: ModuleInstance, sk: PrivateKey, path: number[]): PrivateKey {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      sk = BLS.AugSchemeMPL.derive_child_sk(sk, p);
    }
    return sk;
  }

  async derive(privateKey: Uint8Array): Promise<deriveCallback> {
    const BLS = await loadBls();
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return (path: number[]) => this.derivePath(BLS, sk, path);
  }

  async getBLS(
    privateKey: Uint8Array
  ): Promise<{ BLS: ModuleInstance; sk: PrivateKey }> {
    const BLS = await loadBls();
    const sk = BLS.PrivateKey.from_bytes(privateKey, false);
    return { BLS, sk };
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
