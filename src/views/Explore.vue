<template>
  <div class="column nav-box mb-6">
    <div :class="{ box: !isMobile, 'pt-8': isMobile }">
      <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom front" style="z-index: 99">
        <span @click="mode = 'List'" v-if="mode == 'Offer'"
          ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon></span
        >{{ title }}
      </p>
      <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top" style="z-index: 99">
        <span @click="mode = 'List'" v-if="mode == 'Offer'"
          ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon></span
        >{{ title }}
      </p>
      <div v-if="mode == 'List'" class="pt-4">
        <div class="panel">
          <p class="panel-heading">{{ $t("explore.cat.title") }}</p>
          <div class="panel-body">
            <div class="columns panel-block is-mobile" v-for="(cat, index) of tailList" :key="index">
              <div class="column">
                <div class="is-flex">
                  <div class="mr-4 py-1">#{{ index + 1 }}</div>
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
              <div class="column buttons has-text-centered">
                <b-button
                  @click="
                    getOffers('XCH', cat.hash);
                    offeredName = 'XCH';
                    requestedName = cat.code;
                    isNft = false;
                  "
                  >{{ $t("explore.button.buy") }}</b-button
                >
                <b-button
                  @click="
                    getOffers(cat.hash, 'XCH');
                    offeredName = cat.code;
                    requestedName = 'XCH';
                    isNft = false;
                  "
                  >{{ $t("explore.button.sell") }}</b-button
                >
              </div>
            </div>
          </div>
        </div>
        <div class="panel pt-4">
          <p class="panel-heading">{{ $t("explore.nft.title") }}</p>
          <div class="panel-body">
            <div class="columns panel-block is-mobile" v-for="(col, index) of nftList" :key="index">
              <div class="column">
                <div class="is-flex">
                  <div class="mr-4 py-1">#{{ index + 1 }}</div>
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
              <div class="column buttons has-text-centered">
                <b-button
                  @click="
                    getOffers('XCH', col.hash);
                    requestedName = col.code;
                    offeredName = 'XCH';
                    isNft = true;
                  "
                  >{{ $t("explore.button.buy") }}</b-button
                >
              </div>
            </div>
          </div>
        </div>
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
                <p v-for="offered of offer.offered" :key="offered.code" :class="{ 'has-text-right': offered.is_nft }">
                  <span v-if="offered.is_nft"
                    >{{ offered.name }}<img class="image is-48x48 is-inline-block ml-3" :src="offered.preview.tiny"
                  /></span>
                  <span v-else> {{ offered.amount }} {{ offered.code }} </span>
                </p>
              </td>
              <td class="is-hidden-mobile">
                <div v-if="offer.offered[0].is_nft">{{ offer.price }} {{ offeredName }}</div>
                <div v-else>
                  <p>1 {{ requestedName }} = {{ offer.price }} {{ offeredName }}</p>
                  <p>1 {{ offeredName }} = {{ 1 / offer.price }} {{ requestedName }}</p>
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
      <p class="has-text-centered mt-6 pt-4 is-size-7 has-text-grey">{{ $t("explore.ascription") }}</p>
    </div>
  </div>
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue, Watch } from "vue-property-decorator";
import { TailInfo } from "@/services/api/tailDb";
import Dexie, { Offer } from "@/services/api/dexie"
import TopBar from "@/components/Common/TopBar.vue";
import TakeOffer from "@/components/Offer/Take.vue";
import { AccountEntity, CustomCat } from "@/models/account";
import { getAllCats } from "@/store/modules/account";
import store from "@/store";
import { tc } from "@/i18n/i18n";

type Mode = "List" | "Offer"
@Component({ components: { TopBar } })
export default class Settings extends Vue {
  offers: Offer[] = [];
  mode: Mode = "List"
  offeredName = "";
  requestedName = "";
  offeredHash = "";
  requestedHash = "";
  total = 0;
  current = 1;
  pageSize = 20;
  isNft = false;

  get isMobile(): boolean {
    return isMobile();
  }

  get title(): string {
    if (this.mode == "List") {
      return tc("explore.title") ?? "";
    } else {
      if (this.isNft) return tc("explore.nft.title") ?? "";
      return tc("explore.cat.title") ?? "";
    }
  }

  get tailList(): TailInfo[] {
    return [{ code: "SBX", hash: "a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e4832913", logo_url: "https://images.taildatabase.com/tails/db5d19ef-c798-4f96-b448-2eea788dbe0e.png" },
    { code: "TRTG", hash: "e0ed5a8e325a7dbadfefd760533afb37e89d17a3ffa05e681b1c4b897d5e86b7", logo_url: "https://images.taildatabase.com/tails/be1506db-d392-4adb-b21e-83714b1ebd4e.png" },
    { code: "UFCG", hash: "d5cfbfadf873554d5184ebcb9dee86e69f8b11f44a0cc4e417871c4f7fb17b9a", logo_url: "https://images.taildatabase.com/tails/86b58642-7ae5-43b4-8efe-7425fe2a1fde.jpeg" }]
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
    this.mode = "Offer"
    this.offeredHash = offered;
    this.requestedHash = requested;
    const resp = await Dexie.getOffer(requested, offered, this.current, this.pageSize);
    if (resp?.success) {
      this.offers = resp.offers;
      this.total = resp.count;
    }
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

.front {
  z-index: 99;
}
</style>