<template>
  <div>
    <!--<div class="columns panel-block is-mobile has-background-white-ter" v-for="(col, index) of ad" :key="index">
      <div class="column">
        <div class="is-flex">
          <div class="mr-4 py-1"><b-tag type="is-info">AD</b-tag></div>
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
    </div>-->
    <div v-if="!nftMarket.length" class="has-text-centered"><!-- {{ $t("common.message.noResult") }}--></div>
    <div v-else class="columns panel-block is-mobile" v-for="(col, index) of nftMarket" :key="index">
      <div class="column">
        <div class="is-flex">
          <div class="mr-4 py-1"><!--#{{ index + 1 }}--></div>
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
        <b-button :size="isMobile ? 'is-small' : 'is-normal'" @click="buy(col)">{{ $t("explore.button.view") }}</b-button>
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
export default class NftMarket extends Vue {
  nftMarkets: Markets = { xch: [] };
  loading = false;
  activeTab = 0;
  ad: MarketItem[] = [
    {
      icon: "https://nft.dexie.space/preview/tiny/col14v8xqlfkkjqdxudecr2p9y6363dec0hzl0lucnufv92u26cm38yqrlf2wy.webp",
      id: "ab0e607d36b480d371b9c0d4129351d45b9c3ee2fbffcc4f896155c56b1b89c8",
      is_nft: 1,
      name: "PassPaw 2022",
    },
  ];

  get isMobile(): boolean {
    return isMobile();
  }

  get network(): string {
    return chainId();
  }

  get iconUrlPrefix(): string {
    return Dexie.dexieIconUrl;
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
    this.loading = false;
    localStorage.setItem("NFT_MARKET", JSON.stringify(this.nftMarkets));
  }

  mounted(): void {
    this.activeTab = this.marketType == "cat" ? 1 : 0;
    if (this.network == mainnetChainId()) {
      const nft = localStorage.getItem("NFT_MARKET");
      if (nft) this.nftMarkets = JSON.parse(nft) as Markets;
      this.updateMarket();
    }
  }

  buy(item: MarketItem): void {
    this.$router.push(`/explore/offers/nft/xch/${item.id}/1`);
  }

  sell(item: MarketItem): void {
    this.$router.push(`/explore/offers/nft/${item.id}/xch/1`);
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";
</style>
