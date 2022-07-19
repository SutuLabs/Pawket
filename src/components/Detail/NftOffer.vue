<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offer.make.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template>
        <b-field label="Offer">
          <p class="control">
            <span class="button is-static">NFT</span>
          </p>
          <b-input expanded v-model="nft.hash"></b-input>
        </b-field>
        <b-field>
          <img :src="nft.uri" class="image is-64x64" />
          <span class="pl-2 has-text-grey"
            ><p>{{ nft.name }}</p>
            <p>Amount: 1</p></span
          >
        </b-field>
        <b-field label="Request">
          <template v-for="(request, idx) in requests">
            <token-amount-field
              :key="idx"
              v-model="request.amount"
              :selectedToken="request.token"
              :token-names="tokenNames"
              :fee="0"
              :showMaxAmount="false"
              label=""
              @change-token="(token) => (request.token = token)"
            >
            </token-amount-field>
          </template>
        </b-field>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="$t('offer.make.ui.button.cancel')" class="is-pulled-left" @click="close()"></b-button>
        <b-button v-if="!bundle" type="is-primary" class="is-pulled-right" @click="sign()">
          {{ $t("offer.make.ui.button.sign") }}
          <b-loading :is-full-page="false" :active="!tokenPuzzles || !availcoins || signing"></b-loading>
        </b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import { AccountEntity } from "@/store/modules/account";
import { prefix0x } from "@/services/coin/condition";
import store from "@/store";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { SymbolCoins } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import puzzle from "@/services/crypto/puzzle";
import DevHelper from "../DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { getOfferEntities, getOfferSummary, OfferEntity, OfferSummary, OfferTokenAmount } from "@/services/offer/summary";
import { getCatIdDict, getCatNameDict, getCatNames } from "@/services/coin/cat";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { generateOffer, generateOfferPlan } from "@/services/offer/bundler";
import bigDecimal from "js-big-decimal";
import { xchSymbol } from "@/store/modules/network";
import { NFT } from "./NftPanel.vue";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
  },
})
export default class NftOffer extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() public nft!: NFT;

  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public bundle: SpendBundle | null = null;
  public step: "Input" | "Confirmation" = "Input";
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;

  public requests: OfferTokenAmount[] = [{ token: xchSymbol(), amount: "0" }];
  public offers: OfferTokenAmount[] = [{ token: xchSymbol(), amount: "0" }];
  // public requests: OfferTokenAmount[] = [{ token: "BSH", amount: "0.011" }];
  // public offers: OfferTokenAmount[] = [{ token: xchSymbol(), amount: "0.000000000009" }];

  get bundleText(): string {
    return this.offerBundle == null ? "" : JSON.stringify(this.offerBundle);
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }

  get cats(): { [id: string]: string } {
    return getCatNameDict(this.account);
  }

  get catIds(): { [name: string]: string } {
    return getCatIdDict(this.account);
  }

  get tokenNames(): string[] {
    return getCatNames(this.account);
  }

  async mounted(): Promise<void> {
    await this.loadCoins();
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  getTotalAmount(token: string): string {
    if (!this.availcoins || !this.availcoins[token] || token == xchSymbol()) {
      return "-1";
    }

    const availcoins = this.availcoins[token].map((_) => _.amount);
    const decimal = 3;
    const totalAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, decimal),
      decimal
    );
    return totalAmount;
  }

  getMaxAmount(token: string): string {
    if (!this.availcoins || !this.availcoins[token]) {
      return "-1";
    }

    const availcoins = this.availcoins[token].map((_) => _.amount);
    const decimal = token == xchSymbol() ? 12 : 3;
    const singleMax = bigDecimal.divide(
      availcoins.reduce((a, b) => (a > b ? a : b), 0n),
      Math.pow(10, decimal),
      decimal
    );
    const totalAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, decimal),
      decimal
    );
    if (token == xchSymbol()) {
      return totalAmount;
    } else {
      return singleMax;
    }
  }

  setMax(offer: OfferTokenAmount): void {
    const newAmount = this.getMaxAmount(offer.token);
    offer.amount = newAmount;
  }

  async loadCoins(): Promise<void> {
    if (!this.tokenPuzzles || this.tokenPuzzles.length == 0) {
      this.tokenPuzzles = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      this.availcoins = await coinHandler.getAvailableCoins(this.tokenPuzzles, coinHandler.getTokenNames(this.account));
    }
  }

  async updateOffer(): Promise<void> {
    this.offerBundle = null;
    this.offerBundle = await decodeOffer(this.offerText);
    this.summary = null;
    this.summary = await getOfferSummary(this.offerBundle);
  }

  async sign(): Promise<void> {
    if (!this.availcoins || !this.tokenPuzzles || !this.account.firstAddress) {
      return;
    }

    try {
      this.signing = true;

      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      const offs: OfferEntity[] = getOfferEntities(this.offers, "", this.catIds);
      const reqs: OfferEntity[] = getOfferEntities(this.requests, change_hex, this.catIds);

      const offplan = await generateOfferPlan(offs, change_hex, this.availcoins, 0n);
      const bundle = await generateOffer(offplan, reqs, this.tokenPuzzles);
      // for creating unit test
      // console.log("const offplan=", JSON.stringify([offplan], null, 2), ";");
      // console.log("const reqs=", JSON.stringify(reqs, null, 2), ";");
      // console.log("const bundle=", JSON.stringify(bundle, null, 2), ";");
      // console.log("coinHandler.getAssetsRequestDetail", JSON.stringify(this.account, null, 2), ";");
      this.bundle = bundle;
      this.offerText = await encodeOffer(bundle);

      this.step = "Confirmation";
    } catch (error) {
      Notification.open({
        message: this.$tc("offer.make.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signing = false;
    }

    this.signing = false;
  }

  debugOffer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { inputOfferText: this.offerText },
    });
  }

  copy(): void {
    store.dispatch("copy", this.offerText);
  }

  debugBundle(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { inputBundleText: this.bundleJson },
    });
  }
}
</script>

<style scoped lang="scss"></style>
