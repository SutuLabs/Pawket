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

@Component
export default class HelloWorld extends Vue {
  @Prop() private msg!: string;

  public seedMnemonic="";
  public password="";
  public chiaPasswordMnemonic="";

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
  }

  generate(){
    var array = new Uint8Array(16);
    self.crypto.getRandomValues(array);
    this.seedMnemonic = entropyToMnemonic(new Buffer(array));
  }

  calculate(){
    let seeds = mnemonicToSeedSync(this.seedMnemonic, this.password);
    this.chiaPasswordMnemonic = entropyToMnemonic(new Buffer(seeds.slice(0,32)));
    let d = mnemonicToSeedSync(this.chiaPasswordMnemonic);
    console.log(d);
  }
}
</script>

<style scoped lang="scss">
</style>
