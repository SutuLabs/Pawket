<template>
  <div class="content">
    <h1>Chia Developer Toolkit</h1>
    <p>
      A web-based collection of cryptography tools and chialisp coin tools used in
      <a target="_blank" href="https://chia.net">Chia blockchain</a>.
    </p>
    <p>
      <b>
        This toolkit has been built to assist the development of
        <a target="_blank" href="https://pawket.app">Pawket Wallet</a> and Chia Name Service.
      </b>
      <br />
      With this toolkit, you can play around with different schemes and algorithms to understand how they work. Or you can create
      a real chialisp program with a visual audit tool.
      <br />
      However, you should be warned, if you want to create strong cryptographic keys or paste sensitive information.
      <br />
      Please do this in an <b>offline environment</b>.
    </p>
    <h2>Tools</h2>
    <ul>
      <li><router-link :to="{ name: 'Bech32m' }">Address ⇋ Hash Converter (bech32m)</router-link></li>
      <li><router-link :to="{ name: 'CLVM' }">Chialisp → CLVM ⇋ Hex → Hash Converter</router-link></li>
      <li><router-link :to="{ name: 'Bundle' }">Spend Bundle Inspector</router-link></li>
      <li><router-link :to="{ name: 'Offer' }">Offer Inspector</router-link></li>
      <li><router-link :to="{ name: 'Coin' }">On-Chain Coin Inspector</router-link></li>
      <li><router-link :to="{ name: 'Simulator' }">CLVM Simulator</router-link></li>
      <li><router-link :to="{ name: 'CoinDeveloper' }">Chialisp Coin Studio</router-link></li>
    </ul>
    <p class="is-pulled-right">by <a target="_blank" href="https://twitter.com/icerdesign">@icerdesign</a></p>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";

@Component({
  components: {
    KeyBox,
  },
})
export default class MixchHome extends Vue {}
</script>

<style scoped lang="scss"></style>
