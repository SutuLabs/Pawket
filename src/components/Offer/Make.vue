<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offer.make.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field :label="$t('offer.make.ui.field.offer')">
          <template v-for="(offer, idx) in offers">
            <token-amount-field
              :key="idx"
              v-model="offer.amount"
              :selectedToken="offer.token"
              :token-names="tokenNames"
              :fee="0"
              label=""
              @change-token="(token) => (offer.token = token)"
            >
            </token-amount-field>
          </template>
        </b-field>
        <b-field :label="$t('offer.make.ui.field.request')">
          <template v-for="(request, idx) in requests">
            <token-amount-field
              :key="idx"
              v-model="request.amount"
              :selectedToken="request.token"
              :token-names="tokenNames"
              :fee="0"
              label=""
              @change-token="(token) => (request.token = token)"
            >
            </token-amount-field>
          </template>
        </b-field>
      </template>
      <template v-if="step == 'Confirmation'">
        <b-field v-if="summary" :label="$t('offer.make.ui.panel.information')">
          <template #message>
            <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
              <li>{{ sumkey }}</li>
              <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
                <b-taglist attached>
                  <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + '(' + ent.id + ')'">{{
                    cats[ent.id]
                  }}</b-tag>
                  <b-tag v-else-if="ent.id" type="is-info" :title="ent.id"
                    >{{ $t("offer.symbol.Cat") }} {{ ent.id.slice(0, 7) + "..." }}</b-tag
                  >
                  <b-tag v-else type="is-info">{{ $t("offer.symbol.XCH") }}</b-tag>

                  <b-tag type="">{{ ent.amount }}</b-tag>
                  <b-tag type="is-info is-light" :title="ent.target">{{ ent.target.slice(0, 7) + "..." }}</b-tag>
                </b-taglist>
              </li>
            </ul>
          </template>
        </b-field>
        <b-field :message="$t('offer.make.ui.panel.hint.thisIsYourOffer')">
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
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('offer.make.ui.button.cancel')" @click="close()"></b-button>
        <b-button v-if="!bundle" type="is-success" @click="sign()">
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
import { AccountEntity, defaultCats } from "@/store/modules/account";
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
import { getCatIdDict, getCatNameDict } from "@/services/coin/cat";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { generateOffer, generateOfferPlan } from "@/services/offer/bundler";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
  },
})
export default class MakeOffer extends Vue {
  @Prop() private account!: AccountEntity;
  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public bundle: SpendBundle | null = null;
  public step: "Input" | "Confirmation" = "Input";
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;

  public requests: OfferTokenAmount[] = [{ token: "XCH", amount: "0" }];
  public offers: OfferTokenAmount[] = [{ token: "XCH", amount: "0" }];
  // public requests: OfferTokenAmount[] = [{ token: "BSH", amount: "0.011" }];
  // public offers: OfferTokenAmount[] = [{ token: "XCH", amount: "0.000000000009" }];

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
    return Object.keys(store.state.account.tokenInfo).concat(
      defaultCats.map((_) => _.name),
      this.account.cats.map((_) => _.name)
    );
  }

  async mounted(): Promise<void> {
    await this.loadCoins();
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
      props: { inputBundleText: this.bundleJson },
    });
  }
}
</script>

<style scoped lang="scss"></style>
