<template>
  <div class="pt-4">
    <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top" style="z-index: 10">
      {{ $t("explore.title") }}
    </p>
    <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">
      {{ $t("explore.title") }}
    </p>
    <b-progress size="is-large" type="is-primary" v-if="loading" show-value>{{ $t("explore.loading") }}</b-progress>
    <div class="tabs is-centered is-boxed is-fullwidth mt-4">
      <ul>
        <li :class="{ 'is-active': path == '/explore/market/nft' }">
          <router-link :to="{ path: '/explore/market/nft' }">{{ $t("explore.nft.title") }}</router-link>
        </li>
        <li :class="{ 'is-active': path == '/explore/market/cat' }">
          <router-link :to="{ path: '/explore/market/cat' }">{{ $t("explore.cat.title") }}</router-link>
        </li>
      </ul>
    </div>
    <router-view></router-view>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue } from "vue-property-decorator";
import Dexie from "@/services/api/dexie";
import { MarketItem, Markets } from "@/models/market";
import { chainId, mainnetChainId } from "@/store/modules/network";

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
    return chainId();
  }

  get iconUrlPrefix(): string {
    return Dexie.dexieIconUrl;
  }

  get path(): string {
    return this.$route.path;
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
    if (this.network == mainnetChainId()) {
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
