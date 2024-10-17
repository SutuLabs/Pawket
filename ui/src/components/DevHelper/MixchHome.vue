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
        <a target="_blank" href="https://pawket.app">Pawket Wallet</a> and
        <a target="_blank" href="https://xch.cool">Chia Name Service</a>.
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
      <li><router-link :to="{ name: 'Address' }">Address ⇋ Hash Converter (bech32m)</router-link></li>
      <li><router-link :to="{ name: 'Name' }">Get coin Id/Name from properties</router-link></li>
      <li><router-link :to="{ name: 'CLVM' }">Chialisp → CLVM ⇋ Hex → Hash Converter</router-link></li>
      <li><router-link :to="{ name: 'Bundle' }">Spend Bundle Inspector</router-link></li>
      <li><router-link :to="{ name: 'Offer' }">Offer Inspector</router-link></li>
      <li><router-link :to="{ name: 'Coin' }">On-Chain Coin Inspector</router-link></li>
      <li><router-link :to="{ name: 'Simulator' }">CLVM Simulator</router-link></li>
      <li><router-link :to="{ name: 'CoinDeveloper' }">Chialisp Coin Studio</router-link></li>
    </ul>
    <h2>Donations</h2>
    <p>
      If you find this toolkit useful, please consider donating to support the development and maintenance of this project. Thank
      you!
      <br />
      Donation Address:
      <key-box
        :value="`xch16xwqtf2d4jljks8lfpp4xnz8jak7jqjxc07y9tqlgt4grdp5hr4q7vcx3s`"
        display="xch16xwqtf2d4jljks8lfpp4xnz8jak7jqjxc07y9tqlgt4grdp5hr4q7vcx3s"
        icon="checkbox-multiple-blank-outline"
      />
      (
      <a target="_blank" href="https://pawket.xch.cool/">pawket.xch</a>
      )
    </p>
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
