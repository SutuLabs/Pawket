<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offer.make.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field label="Offer">
          <b-input :value="nft.address" disabled></b-input>
        </b-field>
        <b-field>
          <img :src="nft.metadata.uri" class="image is-64x64" />
          <span class="pl-2 has-text-grey"
            ><p>{{ nft.metadata.name }}</p>
          </span>
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
      <template v-if="step == 'Confirmation'">
        <b-field :label="'NOTHING'" :message="$t('offer.make.ui.panel.hint.thisIsYourOffer')">
          <template #label>
            {{ $t("offer.make.ui.label.yourOfferTitle") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="offerText" tooltip="Copy"></key-box>
            <a href="javascript:void(0)" v-if="debugMode || true" @click="debugOffer()">🐞</a>
          </template>
          <b-input type="textarea" :value="offerText" disabled></b-input>
        </b-field>
        <b-field v-if="debugMode && bundle">
          <template #label>
            {{ $t("offer.make.ui.label.bundle") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
            <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
          </template>
          <b-input type="textarea" disabled :value="bundleJson"></b-input>
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
      <div>
        <b-button
          :label="$t('offer.make.ui.button.copy')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="copy()"
        ></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import { AccountEntity } from "@/models/account";
import store from "@/store";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { SymbolCoins } from "@/services/transfer/transfer";
import { NftDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import DevHelper from "../DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { getOfferEntities, getOfferSummary, OfferEntity, OfferSummary, OfferTokenAmount } from "@/services/offer/summary";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { chainId, xchSymbol } from "@/store/modules/network";
import { prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import { generateNftOffer, generateOfferPlan } from "@/services/offer/bundler";
import { getLineageProofPuzzle } from "@/services/transfer/call";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
  },
})
export default class NftOffer extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() public nft!: NftDetail;

  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public bundle: SpendBundle | null = null;
  public step: "Input" | "Confirmation" = "Input";
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;

  public requests: OfferTokenAmount[] = [{ token: xchSymbol(), amount: "0" }];
  // public requests: OfferTokenAmount[] = [{ token: xchSymbol(), amount: "0.000000000008" }];

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

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  async mounted(): Promise<void> {
    await this.loadCoins();
  }

  get xchSymbol(): string {
    return xchSymbol();
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
      const offs: OfferEntity[] = [
        {
          id: puzzle.getPuzzleHashFromAddress(this.nft.address),
          amount: 1n,
          target: "",
          nft_target: "",
          royalty: this.nft.analysis.tradePricePercentage,
          nft_uri: this.nft.metadata.uri,
        },
      ];
      const reqs: OfferEntity[] = getOfferEntities(this.requests, change_hex, {}, xchSymbol());

      // for creating unit test
      // console.log("const change_hex=" + JSON.stringify(change_hex, null, 2) + ";");
      // console.log("const nft=" + JSON.stringify(this.nft, null, 2) + ";");
      // console.log("const offs=" + JSON.stringify(offs, null, 2) + ";");
      // console.log("const reqs=" + JSON.stringify(reqs, null, 2) + ";");
      // console.log("const availcoins=" + JSON.stringify(this.availcoins, null, 2) + ";");
      const offplan = await generateOfferPlan(offs, change_hex, this.availcoins, 0n, xchSymbol());
      const bundle = await generateNftOffer(
        offplan,
        this.nft.analysis,
        this.nft.coin,
        reqs,
        this.tokenPuzzles,
        getLineageProofPuzzle,
        xchSymbol(),
        chainId()
      );
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
