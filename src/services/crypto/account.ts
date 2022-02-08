import store from "@/store";
import {
  entropyToMnemonic,
  mnemonicToSeedSync,
} from "bip39";

import pbkdf2Hmac from "pbkdf2-hmac";
import utility from "./utility";

export interface AccountKey {
  compatibleMnemonic: string;
  fingerprint: number;
  privateKey: string;
}

class AccountHelper {

  generateSeed() {
    const array = new Uint8Array(16);
    self.crypto.getRandomValues(array);
    return entropyToMnemonic(new Buffer(array));
  }

  async getAccount(mnemonic: string, password: string | null, legacyMnemonic: string | null = null): Promise<AccountKey> {
    if (legacyMnemonic && (mnemonic || password)) throw "legacy mnemonic cannot work with new mnemonic/password!";
    const seeds = mnemonicToSeedSync(mnemonic, password ?? "");
    let compatibleMnemonic = entropyToMnemonic(
      new Buffer(seeds.slice(0, 32))
    );
    if (legacyMnemonic) compatibleMnemonic = legacyMnemonic;

    // let d = mnemonicToSeedSync(compatibleMnemonic);
    const BLS = store.state.app.bls;
    if (!BLS) throw "BLS not initialized";
    const key = await pbkdf2Hmac(
      compatibleMnemonic,
      "mnemonic",
      2048,
      64,
      "SHA-512"
    );

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
      privateKey: utility.toHexString(sk.serialize()),
    };
  }
}

export default new AccountHelper();
