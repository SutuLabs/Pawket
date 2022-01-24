<template>
  <div class="hello">
    <b-field label="问题">
      <b-input type="text" v-model="seedMnemonic"></b-input>
    </b-field>
    <b-button @click="generate()">Generate</b-button>
    <b-field label="password">
      <b-input type="text" v-model="password" @change="chiaPasswordMnemonic=''"></b-input>
    </b-field>
    <b-button @click="calculate()">calculate</b-button>
    {{chiaPasswordMnemonic}}
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
// const bip39 = require('bip39')
import {
  entropyToMnemonic,
  mnemonicToEntropy,
  mnemonicToSeedSync,
} from "bip39";
import bls from "@chainsafe/bls/browser";

import loadBls from "@aguycalled/bls-signatures";
import { PrivateKey, ModuleInstance } from "@aguycalled/bls-signatures";
import pbkdf2Hmac from "pbkdf2-hmac";

@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;

  public seedMnemonic = "";
  public password = "";
  public chiaPasswordMnemonic = "";

  constructor() {
    super();
  }

  mounted() {
    this.generate();
    // // defaults to BIP39 English word list
    // // uses HEX strings for entropy
    // var array = new Uint8Array(16);
    // self.crypto.getRandomValues(array);
    // console.log(array);
    // // const mnemonic = entropyToMnemonic('00000000000000000000000000000000')
    // // => abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
    // const mnemonic = entropyToMnemonic(new Buffer(array));

    // // reversible
    // let d = mnemonicToEntropy(mnemonic);
    // let e = mnemonicToSeedSync(mnemonic, "world");
    // console.log(mnemonic, d, e);
    // class-based interface

    // const secretKey = bls.SecretKey.fromKeygen();
    // const publicKey = secretKey.toPublicKey();
    // const message = new Uint8Array(32);

    // const signature = secretKey.sign(message);
    // console.log("Is valid: ", signature.verify(publicKey, message));

    // // functional interface
    // const sk = secretKey;//.toBytes();
    // const pk = sk.toPublicKey();
    // const sig = sk.sign( message);
    // console.log("Is valid: ", sig.verify(pk, message));

    //  loadBls().then(BLS=>{

    // var seed = Uint8Array.from([
    //   0,  50, 6,  244, 24,  199, 1,  25,  52,  88,  192,
    //   19, 18, 12, 89,  6,   220, 18, 102, 58,  209, 82,
    //   12, 62, 89, 110, 182, 9,   44, 20,  254, 22
    // ]);

    // var sk = BLS.AugSchemeMPL.key_gen(seed);
    // var pk = sk.get_g1();

    // var message = Uint8Array.from([1,2,3,4,5]);
    // var signature = BLS.AugSchemeMPL.sign(sk, message);

    // let ok = BLS.AugSchemeMPL.verify(pk, message, signature);
    // console.log(ok,pk.get_fingerprint()); // true
    //  });
  }

  generate() {
    var array = new Uint8Array(16);
    self.crypto.getRandomValues(array);
    this.seedMnemonic = entropyToMnemonic(new Buffer(array));
  }

  calculate() {
    let seeds = mnemonicToSeedSync(this.seedMnemonic, this.password);
    this.chiaPasswordMnemonic = entropyToMnemonic(
      new Buffer(seeds.slice(0, 32))
    );
    let d = mnemonicToSeedSync(this.chiaPasswordMnemonic);
    loadBls().then((BLS) => {
      // var seed = Uint8Array.from([
      //   0,  50, 6,  244, 24,  199, 1,  25,  52,  88,  192,
      //   19, 18, 12, 89,  6,   220, 18, 102, 58,  209, 82,
      //   12, 62, 89, 110, 182, 9,   44, 20,  254, 22
      // ]);

      pbkdf2Hmac(
        this.chiaPasswordMnemonic,
        "mnemonic",
        2048,
        64,
        "SHA-512"
      ).then((key) => {
        // console.log(key);
        var sk = BLS.AugSchemeMPL.key_gen(new Uint8Array(key));
        // var sk = BLS.PrivateKey.from_bytes(seeds, false);
        var pk = sk.get_g1();

        var d = this.derive_path(BLS, sk, [12381, 8444, 0, 0]);
        var e = this.derive_path(BLS, sk, [12381, 8444, 2, 0]);
        console.log(
          pk.get_fingerprint(),
          this.toHexString(e.serialize()),
          this.toHexString(d.get_g1().serialize()),
          this.toHexString(pk.serialize())
        );
      });
      // var message = Uint8Array.from([1,2,3,4,5]);
      // var signature = BLS.AugSchemeMPL.sign(sk, message);

      // let ok = BLS.AugSchemeMPL.verify(pk, message, signature);
      // console.log(ok,pk.get_fingerprint()); // true
    });
  }

  toHexString(byteArray: Uint8Array) {
    return Array.from(byteArray, function (byte) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    }).join("");
  }
  derive_path(BLS: ModuleInstance, sk: PrivateKey, path: number[]): PrivateKey {
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      sk = BLS.AugSchemeMPL.derive_child_sk(sk, p);
    }
    return sk;
  }
}
</script>

<style scoped lang="scss">
</style>
