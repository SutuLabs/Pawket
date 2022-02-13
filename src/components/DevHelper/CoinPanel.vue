<template>
  <div>
    <b-field label="Coin Id">
      <template #message>
        <a
          href="javascript:void(0)"
          v-if="coinSpend && coinSpend.coin.parent_coin_info"
          @click="searchCoinId(coinSpend.coin.parent_coin_info)"
        >
          Search {{ coinSpend.coin.parent_coin_info }}
        </a>
      </template>
      <b-input v-model="coinId" expanded type="text" @keyup.native.enter="searchCoinId(coinId)"></b-input>
      <p class="control">
        <b-button @click="searchCoinId(coinId)">
          <b-icon icon="database-search"></b-icon>
        </b-button>
      </p>
    </b-field>
    <template v-if="coinSpend">
      <b-field label="Result">
        <b-input type="textarea" disabled :value="JSON.stringify(coinSpend, null, 4)"></b-input>
      </b-field>
      <bundle-panel :inputBundleText="bundleText"></bundle-panel>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import debug from '../../services/api/debug';
import { CoinSpend } from '@/models/wallet';
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";

@Component({
  components: {
    KeyBox,
    BundlePanel,
  },
})
export default class CoinPanel extends Vue {

  public coinId = "";
  public coinSpend: CoinSpend | null = null;

  get bundleText(): string {
    return this.coinSpend == null ? "" : JSON.stringify({ aggregated_signature: "", coin_spends: [this.coinSpend] });
  }

  async searchCoinId(coinId: string): Promise<void> {
    if (coinId) this.coinId = coinId;
    this.coinSpend = null;
    this.coinSpend = await debug.getCoinSolution(this.coinId);
  }
}
</script>

<style scoped lang="scss">
</style>
