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
              :showMaxAmount="true"
              :max-amount="getMaxAmount(offer.token)"
              :total-amount="getTotalAmount(offer.token)"
              @set-max="setMax(offer)"
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
              :showMaxAmount="false"
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
                  <b-tag v-else type="is-info">{{ xchSymbol }}</b-tag>

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
            <key-box icon="checkbox-multiple-blank-outline" :value="offerText" tooltip="Copy" position="is-right"></key-box>
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
        <b-button
          v-if="!bundle"
          :label="$t('common.button.cancel')"
          class="is-pulled-left"
          @click="$router.push('/home')"
        ></b-button>
        <b-button
          v-if="bundle"
          :label="$t('offer.make.ui.button.done')"
          class="is-pulled-left"
          @click="$router.push('/home')"
        ></b-button>
        <b-button v-if="!bundle" type="is-primary" :loading="signing" @click="sign()">
          {{ $t("offer.make.ui.button.sign") }}
        </b-button>
      </div>
      <div>
        <b-button
          :label="$t('offer.make.ui.button.uploadToDexie')"
          :loading="uploading"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="uploadToDexie()"
        ></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import { AccountEntity } from "@/models/account";
import { prefix0x } from "@/services/coin/condition";
import store from "@/store";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { SymbolCoins } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import puzzle from "@/services/crypto/puzzle";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { getOfferEntities, getOfferSummary, OfferEntity, OfferSummary, OfferTokenAmount } from "@/services/offer/summary";
import { getCatIdDict, getCatNameDict, getCatNames } from "@/services/view/cat";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { generateOffer, generateOfferPlan } from "@/services/offer/bundler";
import bigDecimal from "js-big-decimal";
import { chainId, xchSymbol } from "@/store/modules/network";
import { getLineageProofPuzzle } from "@/services/transfer/call";
import dexie from "@/services/api/dexie";
import { tc } from "@/i18n/i18n";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
  },
})
export default class MakeOffer extends Vue {
  @Prop() public account!: AccountEntity;
  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public bundle: SpendBundle | null = null;
  public step: "Input" | "Confirmation" = "Input";
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public uploading = false;

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
    if (this.path.endsWith("make-offer")) this.$router.back();
    return;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    if (this.path == "/home") this.close();
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

  getTotalAmount(): string {
    return "-1";
  }

  getMaxAmount(token: string): string {
    if (!this.availcoins || !this.availcoins[token]) {
      return "-1";
    }

    const availcoins = this.availcoins[token].map((_) => _.amount);
    const decimal = token == xchSymbol() ? 12 : 3;
    const totalAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, decimal),
      decimal
    );
    return totalAmount;
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
      const offs: OfferEntity[] = getOfferEntities(this.offers, "()", this.catIds, xchSymbol());
      const reqs: OfferEntity[] = getOfferEntities(this.requests, change_hex, this.catIds, xchSymbol());

      const offplan = await generateOfferPlan(offs, change_hex, this.availcoins, 0n, xchSymbol());
      const bundle = await generateOffer(offplan, reqs, this.tokenPuzzles, getLineageProofPuzzle, xchSymbol(), chainId());
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

  async uploadToDexie(): Promise<void> {
    this.uploading = true;
    try {
      await dexie.uploadOffer(this.offerText);
    } catch (error) {
      if (error != null) {
        Notification.open({
          message: String(error),
          type: "is-danger",
        });
        this.uploading = false;
        return;
      }
    }
    Notification.open({
      message: tc("common.message.uploadSuccess"),
      type: "is-primary",
    });
    this.uploading = false;
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
