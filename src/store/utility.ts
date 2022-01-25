import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
} from "bip39";
import bls from "@chainsafe/bls/browser";

import loadBls from "@aguycalled/bls-signatures";
import { PrivateKey, ModuleInstance } from "@aguycalled/bls-signatures";
import pbkdf2Hmac from "pbkdf2-hmac";

interface AccountKey {
  compatibleMnemonic: string;
  fingerprint: number;
  privateKey: PrivateKey;
}

class Utility {
  generateSeed() {
    const array = new Uint8Array(16);
    self.crypto.getRandomValues(array);
    return entropyToMnemonic(new Buffer(array));
  }

  toHexString(byteArray: Uint8Array) {
    return Array.from(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
  }

  derivePath(BLS: ModuleInstance, sk: PrivateKey, path: number[]): PrivateKey {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      sk = BLS.AugSchemeMPL.derive_child_sk(sk, p);
    }
    return sk;
  }

  async getAccount(mnemonic: string, password: string): AccountKey {
    const seeds = mnemonicToSeedSync(mnemonic, password);
    const compatibleMnemonic = entropyToMnemonic(
      new Buffer(seeds.slice(0, 32))
    );
    // let d = mnemonicToSeedSync(compatibleMnemonic);
    const BLS = await loadBls();
    const key = await pbkdf2Hmac(compatibleMnemonic, "mnemonic", 2048, 64, "SHA-512");

    // console.log(key);
    const sk = BLS.AugSchemeMPL.key_gen(new Uint8Array(key));
    const pk = sk.get_g1();

    // var d = this.derive_path(BLS, sk, [12381, 8444, 0, 0]);
    // var e = this.derive_path(BLS, sk, [12381, 8444, 2, 0]);
    // console.log(
    //   pk.get_fingerprint(),
    //   this.toHexString(e.serialize()),
    //   this.toHexString(d.get_g1().serialize()),
    //   this.toHexString(pk.serialize())
    // );
    return {
      compatibleMnemonic: compatibleMnemonic,
      fingerprint: pk.get_fingerprint(),
      privateKey: sk,
    }
  }

  public encrypt(data:string, key:string):string{
    return data;
  }

  public decrypt(encdata:string, key:string):string{
    return encdata;
  }

  public hash(data:string):string{
    return data;
  }
}

export default new Utility();