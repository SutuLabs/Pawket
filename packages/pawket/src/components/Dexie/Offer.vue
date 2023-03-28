<template>
  <div ref="anchor">
    <p class="is-hidden-tablet has-text-centered is-size-5 pt-5 pb-2 pr-2 border-bottom fixed-top" style="z-index: 10">
      <span @click="back()"
        ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon></span
      >{{ title }}
      <a class="is-size-6" href="javascript:void(0)" @click="refresh()" :disabled="loading">
        <b-icon :icon="loading ? 'autorenew' : 'refresh'" :class="loading ? 'rotate' : 'has-text-primary'" custom-size="mdi-16px">
        </b-icon>
      </a>
    </p>
    <p class="is-hidden-mobile has-text-left is-size-5 pb-2 pl-2 border-bottom">
      <span @click="back()"
        ><b-icon class="is-pulled-left has-text-grey pr-3 is-clickable pt-1" icon="chevron-left"> </b-icon></span
      >{{ title }}
      <a class="is-size-6" href="javascript:void(0)" @click="refresh()" :disabled="loading">
        <b-icon :icon="loading ? 'autorenew' : 'refresh'" :class="loading ? 'rotate' : 'has-text-primary'" custom-size="mdi-16px">
        </b-icon>
      </a>
    </p>
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
      <b-loading :active="loading"></b-loading>
      <thead>
        <tr>
          <th>{{ $t("explore.table.header.offer") }}</th>
          <th class="has-text-left">{{ $t("explore.table.header.receive") }}</th>
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
            <p v-for="offered of offer.offered" :key="offered.code" class="has-text-left">
              <span v-if="offered.is_nft">
                <b-tooltip type="is-light" :triggers="['click', 'hover']" position="is-right" multilined>
                  <template v-slot:content>
                    <div class="card">
                      <div class="card-image">
                        <figure class="image is-1by1">
                          <img :src="offered.nft_data.data_uris[0]" alt="Image" />
                        </figure>
                      </div>
                      <div class="card-content">
                        <div class="media">
                          <div class="media-content">
                            <p class="title is-5">{{ offered.name }}</p>
                          </div>
                        </div>

                        <div class="content" style="word-break: break-all">
                          {{ getAddressFromPuzzleHash(offered.id) }}
                        </div>
                      </div>
                    </div>
                  </template>
                  <img class="image is-48x48 is-inline-block ml-3" :src="offered.preview.tiny" /> </b-tooltip
                >{{ offered.name }}</span
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
            <b-button @click="takeOffer(offer.offer)" :size="isMobile ? 'is-small' : 'is-normal'">{{
              $t("explore.button.takeOffer")
            }}</b-button>
          </td>
        </tr>
      </tbody>
    </table>
    <b-pagination
      :total="total"
      v-model="currentPage"
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
</template>
<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import { Component, Vue, Watch } from "vue-property-decorator";
import TakeOffer from "@/components/Offer/Take.vue";
import { Offer, Offered } from "@/models/dexieOffer";
import { AccountEntity, CustomCat } from "@/models/account";
import store from "@/store";
import { getAllCats } from "@/store/modules/account";
import Dexie from "@/services/api/dexie";
import { tc } from "@/i18n/i18n";
import puzzle from "@/services/crypto/puzzle";

@Component({})
export default class DexieOffer extends Vue {
  offers: Offer[] = [];
  offeredName = "";
  requestedName = "";
  currentPage = 1;
  total = 0;
  pageSize = 20;
  loading = false;
  isPreviewing = false;
  transitioning = false;
  previewNft: Offered | null = null;

  get isMobile(): boolean {
    return isMobile();
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

  get isNft(): boolean {
    return this.$route.params["type"] == "nft";
  }

  get offerType(): string {
    return this.$route.params["type"];
  }

  get offered(): string {
    return this.$route.params["offered"];
  }

  get requested(): string {
    return this.$route.params["requested"];
  }

  get current(): number {
    return Number(this.$route.params["page"]);
  }

  get title(): string {
    if (this.isNft) return tc("explore.nft.title") ?? "";
    return tc("explore.cat.title") ?? "";
  }

  async refresh(): Promise<void> {
    await this.getOffers(this.offered, this.requested);
  }

  back(): void {
    this.$router.push(`/explore/market/${this.offerType}`);
  }

  getAddressFromPuzzleHash(hash: string): string {
    return puzzle.getAddressFromPuzzleHash(hash, "nft");
  }

  @Watch("currentPage")
  onPageChange(): void {
    this.$router.push(`/explore/offers/${this.offerType}/${this.offered}/${this.requested}/${this.currentPage}`);
    this.getOffers(this.offered, this.requested);
  }

  swap(): void {
    this.$router.push(`/explore/offers/${this.offerType}/${this.requested}/${this.offered}/1`);
    this.getOffers(this.offered, this.requested);
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

  async getOffers(offered: string, requested: string): Promise<void> {
    this.loading = true;
    const resp = await Dexie.getOffer(requested, offered, this.current, this.pageSize);
    if (resp?.success) {
      this.offers = resp.offers;
      this.requestedName = this.offers[0].offered[0].code;
      this.offeredName = this.offers[0].requested[0].code;
      this.total = resp.count;
    }
    const anchor = this.$refs.anchor as Element;
    if (anchor) anchor.scrollIntoView();
    this.loading = false;
  }

  mounted(): void {
    this.currentPage = this.current;
    this.getOffers(this.offered, this.requested);
  }
}
</script>
<style scoped lang="scss">
@import "@/styles/topbar.scss";
.rotate {
  animation: rotation 2s infinite linear;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}
</style>
