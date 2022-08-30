<template>
  <div class="pt-4">
    <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top" style="z-index: 10">
      {{ $t("explore.title") }}
    </p>
    <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">
      {{ $t("explore.title") }}
    </p>
    <b-progress size="is-large" type="is-primary" v-if="loading" show-value>{{ $t("explore.loading") }}</b-progress>
    <b-tabs expanded v-model="activeTab">
      <b-tab-item :label="$t('explore.nft.title')">
        <div v-if="!catMarket.length" class="has-text-centered">{{ $t("common.message.noResult") }}</div>
        <div v-else class="columns panel-block is-mobile" v-for="(col, index) of nftMarket" :key="index">
          <div class="column">
            <div class="is-flex">
              <div class="mr-4 py-1">#{{ index + 1 }}</div>
              <div class="mr-4">
                <span class="image is-32x32">
                  <img :src="col.icon" />
                </span>
              </div>
              <div class="py-1 has-text-grey-dark is-size-6">
                {{ col.name }}
              </div>
            </div>
          </div>
          <div class="column buttons has-text-right">
            <b-button :size="isMobile ? 'is-small' : 'is-normal'" @click="buy(col)">{{ $t("explore.button.buy") }}</b-button>
          </div>
        </div>
        <p class="has-text-centered mt-6 pt-4 is-size-7 has-text-grey">
          {{ $t("explore.ascription") }}
        </p>
      </b-tab-item>
      <b-tab-item :label="$t('explore.cat.title')">
        <div class="panel-body">
          <div v-if="!catMarket.length" class="has-text-centered">{{ $t("common.message.noResult") }}</div>
          <div v-else class="columns panel-block is-mobile" v-for="(cat, index) of catMarket" :key="index">
            <div class="column">
              <div class="is-flex">
                <div class="mr-4 py-1">#{{ index + 1 }}</div>
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
      </b-tab-item>
    </b-tabs>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue } from "vue-property-decorator";
import Dexie from "@/services/api/dexie";
import store from "@/store";
import { MarketItem, Markets } from "@/models/market";

@Component({})
export default class DexieMarket extends Vue {
  markets: Markets = { xch: [] };
  nftMarkets: Markets = { xch: [] };
  loading = false;
  activeTab = 0;

  get isMobile(): boolean {
    return isMobile();
  }

  get network(): string {
    return store.state.network.networkId;
  }

  get iconUrlPrefix(): string {
    return Dexie.dexieIconUrl;
  }

  get catMarket(): MarketItem[] {
    return this.markets.xch;
  }

  get nftMarket(): MarketItem[] {
    return this.nftMarkets.xch;
  }

  get marketType(): string {
    return this.$route.params["type"];
  }

  async updateMarket(): Promise<void> {
    this.loading = true;
    this.nftMarkets = await Dexie.getNftMarket();
    this.markets = await Dexie.getMarket();
    this.loading = false;
    localStorage.setItem("NFT_MARKET", JSON.stringify(this.nftMarkets));
    localStorage.setItem("CAT_MARKET", JSON.stringify(this.markets));
  }

  mounted(): void {
    this.activeTab = this.marketType == "cat" ? 1 : 0;
    if (this.network == "mainnet") {
      const nft = localStorage.getItem("NFT_MARKET");
      const cat = localStorage.getItem("CAT_MARKET");
      if (nft) this.nftMarkets = JSON.parse(nft) as Markets;
      if (cat) this.markets = JSON.parse(cat) as Markets;
      this.updateMarket();
    }
  }

  buy(item: MarketItem): void {
    if (item.is_nft) {
      this.$router.push(`/explore/offers/nft/xch/${item.id}/1`);
    } else {
      this.$router.push(`/explore/offers/cat/xch/${item.id}/1`);
    }
  }

  sell(item: MarketItem): void {
    if (item.is_nft) {
      this.$router.push(`/explore/offers/nft/${item.id}/xch/1`);
    } else {
      this.$router.push(`/explore/offers/cat/${item.id}/xch/1`);
    }
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";
</style>
