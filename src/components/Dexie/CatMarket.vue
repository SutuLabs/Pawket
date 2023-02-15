<template>
  <div>
    <div class="panel-body">
      <div v-if="!catMarket.length" class="has-text-centered"><!--{{ $t("common.message.noResult") }}--></div>
      <div v-else class="columns panel-block is-mobile" v-for="(cat, index) of catMarket" :key="index">
        <div class="column">
          <div class="is-flex">
            <div class="mr-4 py-1"><!--#{{ index + 1 }}--></div>
            <div class="mr-4">
              <span class="image is-32x32">
                <img class="is-rounded" :src="iconUrlPrefix + cat.id + '.jpg'" />
              </span>
            </div>
            <div class="py-1 has-text-grey-dark is-size-6">
              {{ cat.code }}
            </div>
          </div>
        </div>
        <div class="column buttons has-text-right">
          <b-button :size="isMobile ? 'is-small' : 'is-normal'" @click="buy(cat)">{{ $t("explore.button.buy") }}</b-button>
          <b-button :size="isMobile ? 'is-small' : 'is-normal'" @click="sell(cat)">{{ $t("explore.button.sell") }}</b-button>
        </div>
      </div>
    </div>
    <p class="has-text-centered mt-6 pt-4 is-size-7 has-text-grey">
      {{ $t("explore.ascription") }}
    </p>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue } from "vue-property-decorator";
import Dexie from "@/services/api/dexie";
import { MarketItem, Markets } from "@/models/market";
import { chainId, mainnetChainId } from "@/store/modules/network";

@Component({})
export default class CatMarket extends Vue {
  markets: Markets = { xch: [] };
  loading = false;
  activeTab = 0;

  get isMobile(): boolean {
    return isMobile();
  }

  get network(): string {
    return chainId();
  }

  get iconUrlPrefix(): string {
    return Dexie.dexieIconUrl;
  }

  get catMarket(): MarketItem[] {
    return this.markets.xch;
  }

  get marketType(): string {
    return this.$route.params["type"];
  }

  async updateMarket(): Promise<void> {
    this.loading = true;
    this.markets = await Dexie.getMarket();
    this.loading = false;
    localStorage.setItem("CAT_MARKET", JSON.stringify(this.markets));
  }

  mounted(): void {
    if (this.network == mainnetChainId()) {
      const cat = localStorage.getItem("CAT_MARKET");
      if (cat) this.markets = JSON.parse(cat) as Markets;
      this.updateMarket();
    }
  }

  buy(item: MarketItem): void {
    this.$router.push(`/explore/offers/cat/xch/${item.id}/1`);
  }

  sell(item: MarketItem): void {
    this.$router.push(`/explore/offers/cat/${item.id}/xch/1`);
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";
</style>
