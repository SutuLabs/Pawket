<template>
  <div class="column nav-box mb-6">
    <div :class="{ box: !isMobile, 'pt-8': isMobile }">
      <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">
        <span @click="mode = 'List'" v-if="mode == 'Offer'"
          ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon></span
        >{{ title }}
      </p>
      <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top" style="z-index: 10">
        <span @click="mode = 'List'" v-if="mode == 'Offer'"
          ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon></span
        >{{ title }}
      </p>
      <div v-if="mode == 'List'" class="pt-4">
        <b-progress size="is-large" type="is-primary" v-if="loading" show-value>{{ $t("explore.loading") }}</b-progress>
        <b-tabs expanded>
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
                <b-button
                  @click="
                    getOffers('XCH', col.id);
                    requestedName = col.code;
                    offeredName = 'XCH';
                    isNft = true;
                  "
                  >{{ $t("explore.button.buy") }}</b-button
                >
              </div>
            </div>
            <p class="has-text-centered mt-6 pt-4 is-size-7 has-text-grey">
              {{ $t("explore.nft.ascription") }}<a href="https://dexie.space/nft" target="_blank">Dexie</a>
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
                  <b-button
                    @click="
                      getOffers('XCH', cat.id);
                      offeredName = 'XCH';
                      requestedName = cat.code;
                      isNft = false;
                    "
                    >{{ $t("explore.button.buy") }}</b-button
                  >
                  <b-button
                    @click="
                      getOffers(cat.code, 'XCH');
                      offeredName = cat.name;
                      requestedName = 'XCH';
                      isNft = false;
                    "
                    >{{ $t("explore.button.sell") }}</b-button
                  >
                </div>
              </div>
            </div>
            <p class="has-text-centered mt-6 pt-4 is-size-7 has-text-grey">{{ $t("explore.cat.ascription") }}</p>
          </b-tab-item>
        </b-tabs>
      </div>
      <div v-if="mode == 'Offer'">
        <div class="columns py-4 has-text-centered is-mobile" v-if="!isNft">
          <div class="column is-5">
            <b-tag type="is-primary" size="is-large">{{ offeredName }}</b-tag>
          </div>
          <div class="column is-2 pt-4">
            <span @click="swap()" class="is-clickable"><b-icon icon="arrow-right"></b-icon></span>
          </div>
          <div class="column is-5">
            <b-tag type="is-primary" size="is-large">{{ requestedName }}</b-tag>
          </div>
        </div>
        <table class="table is-fullwidth has-text-centered">
          <thead>
            <tr>
              <th>{{ $t("explore.table.header.offer") }}</th>
              <th>{{ $t("explore.table.header.receive") }}</th>
              <th class="is-hidden-mobile">{{ $t("explore.table.header.price") }}</th>
              <th>{{ $t("explore.table.header.operation") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(offer, index) of offers" :key="index">
              <td>
                <div v-for="(requested, idx) of offer.requested" :key="idx">
                  <span>{{ requested.amount }} {{ requested.code }}</span>
                </div>
              </td>
              <td>
                <p v-for="offered of offer.offered" :key="offered.code">
                  <span v-if="offered.is_nft"
                    ><img class="image is-48x48 is-inline-block ml-3" :src="offered.preview.tiny" />{{ offered.name }}</span
                  >
                  <span v-else> {{ offered.amount }} {{ offered.code }} </span>
                </p>
              </td>
              <td class="is-hidden-mobile">
                <div v-if="offer.offered[0].is_nft">{{ offer.price.toFixed(4) }} {{ offeredName }}</div>
                <div v-else>
                  <p>1 {{ requestedName }} = {{ offer.price.toFixed(4) }} {{ offeredName }}</p>
                  <p>1 {{ offeredName }} = {{ (1 / offer.price).toFixed(4) }} {{ requestedName }}</p>
                </div>
              </td>
              <td>
                <b-button @click="takeOffer(offer.offer)" size="is-small">{{ $t("explore.button.takeOffer") }}</b-button>
              </td>
            </tr>
          </tbody>
        </table>
        <b-pagination
          :total="total"
          v-model="current"
          :per-page="pageSize"
          icon-prev="chevron-left"
          icon-next="chevron-right"
          aria-next-label="Next page"
          aria-previous-label="Previous page"
          aria-page-label="Page"
          aria-current-label="Current page"
        >
        </b-pagination>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue, Watch } from "vue-property-decorator";
import Dexie from "@/services/api/dexie";
import TopBar from "@/components/Common/TopBar.vue";
import TakeOffer from "@/components/Offer/Take.vue";
import { AccountEntity, CustomCat } from "@/models/account";
import { getAllCats } from "@/store/modules/account";
import store from "@/store";
import { tc } from "@/i18n/i18n";
import { MarketItem, Markets } from "@/models/market";
import { Offer } from "@/models/dexieOffer";

type Mode = "List" | "Offer";
@Component({ components: { TopBar } })
export default class Settings extends Vue {
  offers: Offer[] = [];
  mode: Mode = "List";
  offeredName = "";
  requestedName = "";
  offeredHash = "";
  requestedHash = "";
  total = 0;
  current = 1;
  pageSize = 20;
  isNft = false;
  markets: Markets = { xch: [] };
  nftMarkets: Markets = { xch: [] };
  isCatFold = true;
  isNftFold = true;
  loading = false;

  get isMobile(): boolean {
    return isMobile();
  }

  get network(): string {
    return store.state.network.networkId;
  }

  get title(): string {
    if (this.mode == "List") {
      return tc("explore.title") ?? "";
    } else {
      if (this.isNft) return tc("explore.nft.title") ?? "";
      return tc("explore.cat.title") ?? "";
    }
  }

  get iconUrlPrefix(): string {
    return Dexie.dexieIconUrl;
  }

  get catMarket(): MarketItem[] {
    return this.markets.xch;
  }

  get nftMarket(): MarketItem[] {
    return this.nftMarkets.xch.slice(0, 30);
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get tokenList(): CustomCat[] {
    return getAllCats(this.account);
  }

  @Watch("current")
  onPagechange(): void {
    this.getOffers(this.offeredHash, this.requestedHash);
  }

  async swap(): Promise<void> {
    const temp = this.requestedName;
    this.requestedName = this.offeredName;
    this.offeredName = temp;
    await this.getOffers(this.requestedHash, this.offeredHash);
  }

  async getOffers(offered: string, requested: string): Promise<void> {
    this.loading = true;
    this.mode = "Offer";
    this.offeredHash = offered;
    this.requestedHash = requested;
    const resp = await Dexie.getOffer(requested, offered, this.current, this.pageSize);
    if (resp?.success) {
      this.offers = resp.offers;
      this.total = resp.count;
    }
    this.loading = false;
  }

  takeOffer(offerText: string): void {
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        tokenList: this.tokenList,
        inputOfferText: offerText,
      },
    });
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
    if (this.network == "mainnet") {
      const nft = localStorage.getItem("NFT_MARKET");
      const cat = localStorage.getItem("CAT_MARKET");
      if (nft) this.nftMarkets = JSON.parse(nft) as Markets;
      if (cat) this.markets = JSON.parse(cat) as Markets;
      this.updateMarket();
    }
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";

.nav-box {
  max-width: 1000px;
  margin: auto;
}
</style>
