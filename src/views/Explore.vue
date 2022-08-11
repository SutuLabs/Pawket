<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile, 'pt-8': isMobile }">
      <top-bar :title="$t('explore.title')" :showBack="mode == 'Offer'" @close="mode = 'List'"></top-bar>
      <div v-if="mode == 'List'">
        <div class="panel">
          <p class="panel-heading">
            CAT
            <span
              class="is-pulled-right has-text-info has-text-weight-normal is-size-5 is-clickable"
              @click="showAllCats = !showAllCats"
              >{{ showAllCats ? "less" : "more" }}</span
            >
          </p>
          <div class="panel-body">
            <div class="columns panel-block" v-for="(cat, index) of tailList" :key="cat.code">
              <div class="column is-1">#{{ index + 1 }}</div>
              <div class="column is-9">
                <div class="is-flex">
                  <div class="mr-4">
                    <span class="image is-32x32">
                      <img v-if="cat.logo_url" :src="cat.logo_url" />
                      <img v-else class="is-rounded" src="@/assets/custom-cat.svg" />
                    </span>
                  </div>
                  <div class="py-1 has-text-grey-dark is-size-6">
                    {{ cat.code }}
                  </div>
                </div>
              </div>
              <div class="column is-2 buttons">
                <b-button
                  @click="
                    getOffers('XCH', cat.hash);
                    requested = cat.code;
                  "
                  >Buy</b-button
                >
                <b-button
                  @click="
                    getOffers(cat.hash, 'XCH');
                    offered = cat.code;
                  "
                  >Sell</b-button
                >
              </div>
            </div>
          </div>
        </div>
        <div class="panel">
          <p class="panel-heading">
            NFT
            <span
              class="is-pulled-right has-text-info has-text-weight-normal is-size-5 is-clickable"
              @click="showAllNfts = !showAllNfts"
              >{{ showAllNfts ? "less" : "more" }}</span
            >
          </p>
          <div class="panel-body">
            <div class="columns panel-block" v-for="(col, index) of nftList" :key="index">
              <div class="column is-1">#1{{ index + 1 }}</div>
              <div class="column is-9">
                <div class="is-flex">
                  <div class="mr-4">
                    <span class="image is-32x32">
                      <img v-if="col.logo_url" :src="col.logo_url" />
                      <img v-else class="is-rounded" src="@/assets/custom-cat.svg" />
                    </span>
                  </div>
                  <div class="py-1 has-text-grey-dark is-size-6">
                    {{ col.code }}
                  </div>
                </div>
              </div>
              <div class="column is-2 buttons">
                <b-button
                  @click="
                    getOffers('XCH', col.hash);
                    requested = col.code;
                  "
                  >Buy</b-button
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="mode == 'Offer'">
        <div class="columns py-4 has-text-centered">
          <div class="column is-5">
            <b-tag type="is-primary" size="is-large">{{ offered }}</b-tag>
          </div>
          <div class="column is-2 pt-4"><b-icon icon="arrow-right"></b-icon></div>
          <div class="column is-5">
            <b-tag type="is-primary" size="is-large">{{ requested }}</b-tag>
          </div>
        </div>
        <table class="table is-fullwidth has-text-centered">
          <thead>
            <tr>
              <th>You Offer</th>
              <th>You Receive</th>
              <th>Price</th>
              <th>Operation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(offer, index) of offers" :key="index">
              <td>
                <p v-for="offered of offer.offered" :key="offered.code">{{ offered.amount }} {{ offered.code }}</p>
              </td>
              <td>
                <div v-for="(requested, idx) of offer.requested" :key="idx" class="has-text-right">
                  <span v-if="requested.is_nft"
                    >{{ requested.name }}<img class="image is-48x48 is-inline-block ml-3" :src="requested.preview.tiny"
                  /></span>
                  <span v-else>{{ requested.amount }} {{ requested.code }}</span>
                </div>
              </td>
              <td>
                <div v-if="offer.requested[0].is_nft">{{ offer.price }} {{ offered }}</div>
                <div v-else>
                  <p>{{ offer.price }} {{ requested }}</p>
                  <p>{{ 1 / offer.price }} {{ offered }}</p>
                </div>
              </td>
              <td>
                <b-button @click="takeOffer(offer.offer)" size="is-small">Take Offer</b-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue } from "vue-property-decorator";
import TailDb from "@/services/api/tailDb"
import { TailInfo } from "@/services/api/tailDb";
import Dexie, { Offer } from "@/services/api/dexie"
import TopBar from "@/components/TopBar.vue";
import TakeOffer from "@/components/Offer/Take.vue";
import { AccountEntity, CustomCat } from "@/models/account";
import { getAllCats } from "@/store/modules/account";
import store from "@/store";

type Mode = "List" | "Offer"
@Component({ components: { TopBar } })
export default class Settings extends Vue {
  tails: TailInfo[] = [];
  showAllCats = false;
  showAllNfts = false;
  offers: Offer[] = [];
  mode: Mode = "List"
  offered = "";
  requested = "";

  get isMobile(): boolean {
    return isMobile();
  }

  get tailList(): TailInfo[] {
    return this.showAllCats ? this.tails : this.tails.slice(0, 5);
  }

  get nftList(): TailInfo[] {
    return [{ code: "Chia Friends", hash: "col1z0ef7w5n4vq9qkue67y8jnwumd9799sm50t8fyle73c70ly4z0ws0p2rhl", logo_url: "" },
    { code: "Farmers of the Marmot Kingdom", hash: "col1xmwdsfnd6jugf6mt5hake4d7k22vqyk99ysz493cczm6mxdd80qsqkf44u", logo_url: "" },
    { code: "Chia World Flags", hash: "col1mf6tuzrmwru4dj44s32ncxqnluvtzt949kma07gx6llgxtrme8msatk8w2", logo_url: "" }]
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

  async mounted(): Promise<void> {
    this.tails = await TailDb.getTails();
  }

  async getOffers(offered: string, requested: string): Promise<void> {
    this.mode = "Offer"
    this.offered = offered;
    this.requested = requested;
    this.offers = await Dexie.getOffer(offered, requested) ?? [];
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
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";

.nav-box {
  max-width: 1000px;
  margin: auto;
}
</style>