<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Make Offer</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field label="Offer">
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
        <b-field label="Request">
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
        <b-field v-if="summary" label="Information">
          <template #message>
            <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
              <li>{{ sumkey }}</li>
              <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
                <b-taglist attached>
                  <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + '(' + ent.id + ')'">{{
                    cats[ent.id]
                  }}</b-tag>
                  <b-tag v-else-if="ent.id" type="is-info" :title="ent.id">CAT {{ ent.id.slice(0, 7) + "..." }}</b-tag>
                  <b-tag v-else type="is-info">XCH</b-tag>

                  <b-tag type="">{{ ent.amount }}</b-tag>
                  <b-tag type="is-info is-light" :title="ent.target">{{ ent.target.slice(0, 7) + "..." }}</b-tag>
                </b-taglist>
              </li>
            </ul>
          </template>
        </b-field>
        <b-field message="This is your offer text">
          <template #label>
            Your Offer
            <key-box display="✂️" :value="offerText" tooltip="Copy"></key-box>
            <a href="javascript:void(0)" v-if="debugMode || true" @click="debugOffer()">🐞</a>
          </template>
          <b-input type="textarea" :value="offerText" disabled></b-input>
        </b-field>
        <b-field v-if="debugMode && bundle">
          <template #label>
            {{ $t("send.ui.label.bundle") }}
            <key-box display="✂️" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
            <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
          </template>
          <b-input type="textarea" disabled :value="bundleJson"></b-input>
        </b-field>
      </template>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" @click="close()"></b-button>
        <b-button v-if="!bundle" type="is-success" @click="sign()">
          {{ $t("send.ui.button.sign") }}
          <b-loading :is-full-page="false" :active="!tokenPuzzles || !availcoins || signing"></b-loading>
        </b-button>
      </div>
      <div>
        <b-button :label="'copy'" v-if="bundle" type="is-primary" class="is-pulled-right" @click="copy()"></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import offer, { OfferSummary } from "@/services/transfer/offer";
import { AccountEntity } from "@/store/modules/account";
import { prefix0x } from "@/services/coin/condition";
import store from "@/store";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import transfer, { SymbolCoins, TransferTarget } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import puzzle from "@/services/crypto/puzzle";
import bigDecimal from "js-big-decimal";
import DevHelper from "../DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";

interface OfferTokenAmount {
  token: string;
  amount: string;
}

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
  // public requests: OfferTokenAmount[] = [{ token: "BSH", amount: "0.01" }];
  // public offers: OfferTokenAmount[] = [{ token: "XCH", amount: "0.00000000001" }];

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
    return Object.assign(
      {},
      ...Object.values(store.state.account.tokenInfo).map((_) => ({ [prefix0x(_.id ?? "")]: _.symbol })),
      ...this.account.cats.map((_) => ({ [prefix0x(_.id)]: _.name }))
    );
  }

  get catIds(): { [name: string]: string } {
    return Object.assign(
      {},
      ...Object.values(store.state.account.tokenInfo).map((_) => ({ [_.symbol]: prefix0x(_.id ?? "") })),
      ...this.account.cats.map((_) => ({ [_.name]: prefix0x(_.id) }))
    );
  }

  get tokenNames(): string[] {
    return Object.keys(store.state.account.tokenInfo).concat(this.account.cats.map((_) => _.name));
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
    this.offerBundle = await offer.decode(this.offerText);
    this.summary = null;
    this.summary = await offer.getSummary(this.offerBundle);
  }

  async sign(): Promise<void> {
    if (!this.availcoins || !this.tokenPuzzles || !this.account.firstAddress) {
      return;
    }

    try {
      this.signing = true;
      const off = this.offers[0];

      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      const settlement_tgt = "0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79";

      const tgts: TransferTarget[] = [
        {
          address: settlement_tgt,
          amount: this.getAmount(off.token, off.amount),
          symbol: off.token,
          memos: off.token == "XCH" ? undefined : [settlement_tgt],
        },
      ];
      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, 0n);
      const keys = Object.keys(plan);
      if (keys.length != 1) {
        this.signing = false;
        throw new Error("key length abnormal");
      }

      const offplan = { id: off.token == "XCH" ? "" : "any", plan: plan[keys[0]] };
      const reqs = this.requests.map((_) => ({
        id: _.token == "XCH" ? "" : this.catIds[_.token],
        symbol: _.token,
        amount: this.getAmount(_.token, _.amount),
        target: change_hex,
      }));
      const bundle = await offer.generateOffer([offplan], reqs, this.tokenPuzzles);
      // for creating unit test
      // console.log("const offplan=", JSON.stringify([offplan], null, 2), ";");
      // console.log("const reqs=", JSON.stringify(reqs, null, 2), ";");
      // console.log("const bundle=", JSON.stringify(bundle, null, 2), ";");
      // console.log("coinHandler.getAssetsRequestDetail", JSON.stringify(this.account, null, 2), ";");
      this.bundle = bundle;
      this.offerText = await offer.encode(bundle);

      this.step = "Confirmation";
    } catch (error) {
      Notification.open({
        message: this.$tc("send.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signing = false;
    }

    this.signing = false;
  }

  private getAmount(symbol: string, amount: string): bigint {
    const decimal = symbol == "XCH" ? 12 : 3;
    return BigInt(bigDecimal.multiply(amount, Math.pow(10, decimal)));
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
}
</script>

<style scoped lang="scss"></style>
