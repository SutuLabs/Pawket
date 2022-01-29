import { NotificationProgrammatic as Notification } from "buefy";
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
} from "bip39";

import loadBls from "@chiamine/bls-signatures";
import { PrivateKey, ModuleInstance } from "@chiamine/bls-signatures";
import pbkdf2Hmac from "pbkdf2-hmac";
import * as clvm_tools from "clvm_tools/browser";
import { bech32m } from "@scure/base";

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

  public async getPuzzleHash(pubkey: string, prefix: string): Promise<string> {
    // console.log(pubkey,prefix);
    if (!pubkey.startsWith("0x")) pubkey = "0x" + pubkey;
    await clvm_tools.initialize();
    const hidden_puzzle_hash = "0x711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699";

    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go(
      "brun",
      "(point_add 2 (pubkey_for_exp (sha256 2 5)))",
      `(${pubkey} ${hidden_puzzle_hash})`
    );
    const synPubkey = output[0];
    // console.log("synPubkey", synPubkey);
    clvm_tools.go(
      "opc",
      "-H",
      `(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1))`
    );
    const puzzleHash = output[0];
    // console.log("puzzleHash", puzzleHash);

    return puzzleHash;
  }

  public async getAddress(pubkey: string, prefix: string): Promise<string> {
    const puzzleHash = await this.getPuzzleHash(pubkey, prefix);

    const address = bech32m.encode(prefix, bech32m.toWords(this.fromHexString(puzzleHash)));
    // console.log(address);
    return address;
  }

  public async getPuzzleHashes(privateKey: Uint8Array, prefix: string, startIndex = 0, endIndex = 10) {
    const derive = await this.derive(privateKey);
    const hashes = [];
    for (let i = startIndex; i < endIndex; i++) {
      const pubkey = this.toHexString(
        derive([12381, 8444, 2, i]).get_g1().serialize()
      );
      const hash = await this.getPuzzleHash(pubkey, prefix);
      hashes.push(hash);
    }

    return hashes;
  }
}

export default new Utility();
