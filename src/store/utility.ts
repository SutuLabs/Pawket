import { NotificationProgrammatic as Notification } from "buefy";
import {
  entropyToMnemonic,
  mnemonicToSeedSync,
} from "bip39";

import loadBls from "@chiamine/bls-signatures";
import { PrivateKey, ModuleInstance } from "@chiamine/bls-signatures";
import pbkdf2Hmac from "pbkdf2-hmac";
import * as clvm_tools from "clvm_tools/browser";
import { bech32m } from "@scure/base";
import store from ".";

type deriveCallback = (path: number[]) => PrivateKey;

export interface AccountKey {
  compatibleMnemonic: string;
  fingerprint: number;
  privateKey: string;
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

  async getAccount(mnemonic: string, password: string | null, legacyMnemonic: string | null = null): Promise<AccountKey> {
    if (legacyMnemonic && (mnemonic || password)) throw "legacy mnemonic cannot work with new mnemonic/password!";
    const seeds = mnemonicToSeedSync(mnemonic, password ?? "");
    let compatibleMnemonic = entropyToMnemonic(
      new Buffer(seeds.slice(0, 32))
    );
    if (legacyMnemonic) compatibleMnemonic = legacyMnemonic;

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
      privateKey: this.toHexString(sk.serialize()),
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
    return this.toHexString(await this.purehash(data));
  }

  public getPuzzle(synPubkey: string): string {
    const puzzle = `(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1))`;
    return puzzle;
  }

  public async getSyntheticKey(pubkey: string): Promise<string> {
    if (!pubkey.startsWith("0x")) pubkey = "0x" + pubkey;
    await store.dispatch("initializeClvm");
    const hidden_puzzle_hash = "0x711d6c4e32c92e53179b199484cf8c897542bc57f2b22582799f9d657eec4699";

    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go(
      "brun",
      "(point_add 2 (pubkey_for_exp (sha256 2 5)))",
      `(${pubkey} ${hidden_puzzle_hash})`
    );
    const synPubkey = output[0];

    return synPubkey;
  }

  public async getPuzzleHash(pubkey: string): Promise<string> {
    const synPubkey = await this.getSyntheticKey(pubkey);
    const puzzle = this.getPuzzle(synPubkey);
    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    clvm_tools.go(
      "opc",
      "-H",
      puzzle
    );
    const puzzleHash = output[0];
    // console.log("puzzleHash", puzzleHash);

    return puzzleHash;
  }

  public getCatPuzzle(synPubkey: string, assetId: string): string {
    if (!synPubkey.startsWith("0x")) synPubkey = "0x" + synPubkey;
    if (!assetId.startsWith("0x")) assetId = "0x" + assetId;

    const catClvmTreehash = "0x72dec062874cd4d3aab892a0906688a1ae412b0109982e1797a170add88bdcdc";
    const puzzle = `(a (q 2 (q 2 94 (c 2 (c (c 5 (c (sha256 44 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (sha256 639 1407 2943) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((-54 . 61) 70 2 . 51) (60 . 4) 1 1 . -53) ((a 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 34 (sha256 44 52) (sha256 34 (sha256 34 (sha256 44 92) 9) (sha256 34 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 38 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) (c (c 5 39) (c (+ 11 87) 119)) 2 (i 5 (q 2 (i (= (a (i (= 17 120) (q . 89) ()) 1) (q . -113)) (q 2 122 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 90 (c 2 (c (a (i (= 17 120) (q 4 120 (c (a 54 (c 2 (c 19 (c 41 (c (sha256 44 91) (c 43 ())))))) 57)) (q 2 (i (= 17 36) (q 4 36 (c (sha256 32 41) 57)) (q . 9)) 1)) 1) (c (a (i (= 17 120) (q . 89) ()) 1) (c (a 122 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) ((a (i 5 (q 4 9 (a 38 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 34 (sha256 44 88) (sha256 34 (sha256 34 (sha256 44 92) 5) (sha256 34 (a 50 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 44 5)) 1) (c (c 40 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 122 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (sha256 1279 (a 54 (c 2 (c 9 (c 2815 (c (sha256 44 45) (c 21 ())))))) 5887) (c 1535 (c 3071 ()))))))))))) 2 42 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (sha256 39 (a 54 (c 2 (c 41 (c 87 (c (sha256 44 -71) (c 89 ())))))) -73)) ()) 1) (c 23 (c 5 (c 767 (c (c (c 36 (c (sha256 124 47 383) ())) (c (c 48 (c (sha256 -65 (sha256 124 21 (+ 383 (- 735 43) 767))) ())) 19)) ()))))))))) 1)) (c (q . ${catClvmTreehash}) (c (q . ${assetId}) (c (q 2 (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . ${synPubkey}) 1)) 1))))`;

    return puzzle;
  }

  public async getCatPuzzleHash(pubkey: string, assetId: string): Promise<string> {
    // console.log(pubkey, assetId);
    const synPubkey = await this.getSyntheticKey(pubkey);
    const puzzle = this.getCatPuzzle(synPubkey, assetId);

    let output: any = null;
    clvm_tools.setPrintFunction((...args) => output = args)

    // console.log("cat puzzle", puzzle);
    clvm_tools.go(
      "opc",
      "-H",
      puzzle
    );
    const puzzleHash = output[0];
    // console.log("cat puzzleHash", puzzleHash);

    return puzzleHash;
  }

  public async getAddress(pubkey: string, prefix: string): Promise<string> {
    const puzzleHash = await this.getPuzzleHash(pubkey);

    const address = bech32m.encode(prefix, bech32m.toWords(this.fromHexString(puzzleHash)));
    // console.log(address);
    return address;
  }

  public async getAddressesFromPuzzleHash(puzzleHashes: string[], prefix: string): Promise<string[]> {
    const arr = [];
    for (let i = 0; i < puzzleHashes.length; i++) {
      const h = puzzleHashes[i];
      arr.push(await this.getAddressFromPuzzleHash(h, prefix));
    }

    return arr;
  }

  public async getAddressFromPuzzleHash(puzzleHash: string, prefix: string): Promise<string> {
    const address = bech32m.encode(prefix, bech32m.toWords(this.fromHexString(puzzleHash)));
    return address;
  }

  public async getPuzzleHashes(privateKey: Uint8Array, startIndex = 0, endIndex = 10) {
    const derive = await this.derive(privateKey);
    const hashes = [];
    for (let i = startIndex; i < endIndex; i++) {
      const pubkey = this.toHexString(
        derive([12381, 8444, 2, i]).get_g1().serialize()
      );
      const hash = await this.getPuzzleHash(pubkey);
      hashes.push(hash);
    }

    return hashes;
  }

  public async getCatPuzzleHashes(privateKey: Uint8Array, assetId: string, startIndex = 0, endIndex = 10) {
    const derive = await this.derive(privateKey);
    const hashes = [];
    for (let i = startIndex; i < endIndex; i++) {
      const pubkey = this.toHexString(
        derive([12381, 8444, 2, i]).get_g1().serialize()
      );
      const hash = await this.getCatPuzzleHash(pubkey, assetId);
      hashes.push(hash);
    }

    return hashes;
  }
}

export default new Utility();
