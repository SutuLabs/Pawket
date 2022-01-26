import { NotificationProgrammatic as Notification } from "buefy";
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
} from "bip39";

import loadBls from "@aguycalled/bls-signatures";
import { PrivateKey, ModuleInstance } from "@aguycalled/bls-signatures";
import pbkdf2Hmac from "pbkdf2-hmac";
type deriveCallback = (path: number[]) => PrivateKey;

export interface AccountKey {
  compatibleMnemonic: string;
  fingerprint: number;
  privateKey: Uint8Array;
}

class Utility {
  copy(copyText: string) {
    const textArea = document.createElement("textarea");
    textArea.value = copyText;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      Notification.open({
        message: `拷贝成功: ${copyText}`,
        type: "is-success",
      });
    } catch (err) {
      Notification.open({
        message: "拷贝成功失败",
        type: "is-danger",
      });
    }

    document.body.removeChild(textArea);
  }

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

  async getAccount(mnemonic: string, password: string): Promise<AccountKey> {
    const seeds = mnemonicToSeedSync(mnemonic, password);
    const compatibleMnemonic = entropyToMnemonic(
      new Buffer(seeds.slice(0, 32))
    );
    // let d = mnemonicToSeedSync(compatibleMnemonic);
    const BLS = await loadBls();
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
      privateKey: sk.serialize(),
    };
  }

  public async encrypt(data: string, key: string): Promise<string> {
    const enc = new TextEncoder();
    const impkey = await window.crypto.subtle.importKey(
      "raw",
      await this.purehash(key),
      "AES-CBC",
      false,
      ["encrypt", "decrypt"]
    );
    const iv = window.crypto.getRandomValues(new Uint8Array(16));
    const part1 = this.toHexString(iv);
    const part2 = this.toHexString(
      new Uint8Array(
        await crypto.subtle.encrypt(
          {
            name: "AES-CBC",
            iv,
          },
          impkey,
          enc.encode(data)
        )
      )
    );
    return part1 + part2;
  }

  public async decrypt(encdata: string, key: string): Promise<string> {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const arr = this.fromHexString(encdata);
    if (arr.length < 16) return "";
    const iv = arr.subarray(0, 16);
    const impkey = await window.crypto.subtle.importKey(
      "raw",
      await this.purehash(key),
      "AES-CBC",
      false,
      ["encrypt", "decrypt"]
    );
    return dec.decode(
      new Uint8Array(
        await crypto.subtle.decrypt(
          {
            name: "AES-CBC",
            iv,
          },
          impkey,
          arr.subarray(16)
        )
      )
    );
  }

  public async purehash(data: string): Promise<Uint8Array> {
    const enc = new TextEncoder();
    return new Uint8Array(
      await crypto.subtle.digest("SHA-256", enc.encode(data))
    );
  }

  public async hash(data: string): Promise<string> {
    const enc = new TextEncoder();
    return this.toHexString(await this.purehash(data));
  }
}

export default new Utility();
