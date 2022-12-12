<template>
  <div class="modal-card">
    <top-bar :title="$t('offer.make.ui.title')" @close="close()" :showClose="true"></top-bar>
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
        <b-field :message="signed ? $t('offer.make.ui.panel.hint.thisIsYourOffer') : ''">
          <template #label>
            {{ $t("offer.make.ui.label.yourOfferTitle") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="offerText" tooltip="Copy" position="is-right"></key-box>
            <a href="javascript:void(0)" v-if="debugMode || true" @click="debugOffer()">🐞</a>
          </template>
          <b-input type="textarea" :value="offerText" disabled></b-input>
        </b-field>
        <span v-if="!signed" class="has-text-danger is-size-6">{{ $t("offer.make.ui.panel.hint.unsignedOffer") }}</span>
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
          v-if="!offerText"
          :label="$t('common.button.cancel')"
          class="is-pulled-left"
          @click="$router.push('/home')"
        ></b-button>
        <b-button
          v-if="offerText"
          :label="$t('offer.make.ui.button.done')"
          class="is-pulled-left"
          @click="$router.push('/home')"
        ></b-button>
        <b-button v-if="!offerText" type="is-primary" :loading="signing" @click="sign()">
          {{ account.type == "PublicKey" ? $t("common.button.generate") : $t("common.button.sign") }}
        </b-button>
      </div>
      <div>
        <b-button
          :label="$t('offer.make.ui.button.uploadToDexie')"
          :loading="uploading"
          v-if="offerText"
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
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { AccountEntity } from "@/models/account";
import { Hex, prefix0x } from "@/services/coin/condition";
import store from "@/store";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { SymbolCoins } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import puzzle from "@/services/crypto/puzzle";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { getOfferEntities, OfferEntity, OfferSummary, OfferTokenAmount } from "@/services/offer/summary";
import { getCatIdDict, getCatNameDict, getCatNames } from "@/services/view/cat";
import { encodeOffer } from "@/services/offer/encoding";
import { generateOffer, generateOfferPlan } from "@/services/offer/bundler";
import bigDecimal from "js-big-decimal";
import { chainId, networkContext, xchSymbol } from "@/store/modules/network";
import dexie from "@/services/api/dexie";
import { tc } from "@/i18n/i18n";
import { lockCoins } from "@/services/coin/coinUtility";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
    TopBar,
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
  public allcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public uploading = false;
  public signed = true;

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
    this.close();
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
    if (!this.allcoins || !this.allcoins[token]) {
      return "-1";
    }
    const allcoins = this.allcoins[token].map((_) => _.amount);
    const decimal = token == xchSymbol() ? 12 : 3;

    const totalAmount = bigDecimal.divide(
      allcoins.reduce((a, b) => a + b, 0n),
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
      this.tokenPuzzles = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins || !this.allcoins) {
      const coins = await getAvailableCoins(this.account);
      this.availcoins = coins[0];
      this.allcoins = coins[1];
    }
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
      const observers = await getAssetsRequestObserver(this.account);
      const ubundle = await generateOffer(offplan, reqs, observers, networkContext());
      this.bundle = await signSpendBundle(ubundle, this.tokenPuzzles, networkContext());

      if (this.account.type == "PublicKey") {
        this.signed = false;
        await this.offlineSignBundle();
      }

      if (this.bundle && this.signed) lockCoins(this.account, this.bundle.coin_spends, Date.now(), chainId());
      this.offerText = await encodeOffer(this.bundle, 4);

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

  async offlineSignBundle(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Offline/OfflineSpendBundleQr.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { bundle: this.bundle, mode: "ONLINE_CLIENT" },
      events: {
        signature: (sig: Hex): void => {
          if (this.bundle) {
            this.bundle.aggregated_signature = prefix0x(sig);
            this.signed = true;
            if (this.bundle) lockCoins(this.account, this.bundle.coin_spends, Date.now(), chainId());
          }
        },
      },
    });
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
