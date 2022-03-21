<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Take Offer</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field label="Offer" :message="offerText ? '' : 'paste offer here, e.g. offer1...'">
          <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
        </b-field>
        <b-field v-if="summary" label="Information">
          <template #message>
            <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
              <li v-if="sumkey == 'requested'">In exchange for</li>
              <li v-if="sumkey == 'offered'">You will receive</li>
              <li>
                <ol class="token-list">
                  <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
                    <b-taglist attached>
                      <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                        cats[ent.id]
                      }}</b-tag>
                      <b-tag v-else-if="ent.id" type="is-info" :title="ent.id">CAT {{ ent.id.slice(0, 7) + "..." }}</b-tag>
                      <b-tag v-else type="is-info" title="Original XCH">XCH</b-tag>

                      <b-tag class="" :title="ent.amount + ' mojos'">{{
                        ent.amount | demojo(ent.id && tokenInfo[cats[ent.id]])
                      }}</b-tag>
                      <b-tag v-if="sumkey == 'requested'" type="is-info is-light" :title="ent.target">{{
                        ent.target.slice(0, 10) + "..."
                      }}</b-tag>
                    </b-taglist>
                  </li>
                </ol>
              </li>
            </ul>
          </template>
        </b-field>
      </template>
      <template v-if="step == 'Confirmation'">
        <b-field v-if="bundle">
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
          <b-loading :is-full-page="false" :active="!tokenPuzzles || !availcoins"></b-loading>
        </b-button>
      </div>
      <div>
        <b-button
          :label="$t('send.ui.button.submit')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
    <b-loading :is-full-page="false" :active="submitting || signing"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import { getCatIdDict, getCatNameDict, getTokenInfo } from "@/services/coin/cat";
import { AccountEntity, TokenInfo } from "@/store/modules/account";
import { demojo } from "@/filters/unitConversion";
import { SymbolCoins } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import coinHandler from "@/services/transfer/coin";
import { getOfferSummary, OfferEntity, OfferSummary } from "@/services/offer/summary";
import { decodeOffer } from "@/services/offer/encoding";
import { NotificationProgrammatic as Notification } from "buefy";
import { combineSpendBundle, generateOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import store from "@/store";
import DevHelper from "../DevHelper.vue";

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo },
})
export default class TakeOffer extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop({
    default:
      "offer1qqp83w76wzru6cmqvpsxygqqama36ngn6fhxtlen3xthnqm0s83gfww3vu3ld0vat8yt6ukl6tlwnhpswkcxq8dduarwhww30fhtf8sm4hnsdw57qvthkzu2acw5s6hhh9e8n4vwfy9jdfr493ww02xdequ5xnmultpg9dfhhthaeqf2ewf3qlt8lnfrj00038u39m26u5umc8r2zd2p48su46g8lemd2sne6rfdg3r7knncj78pzg4nvzr99k5hq5nnf87vadw0dk57a4y0tamaxvwvl0dsnygj873h9geldnel5zfqjat8es0vthvmjfmywasn0ldcmarw4lqzae7q44qm7f0h987vjk3npk2gvzf2qfvhwfflhex74d0yutlnm4dm3dtcjnllmf42ed7rehvrvcxj7yau0ge7kygryq662le6x4xkcwua7rfk0rplvscaahta9ajf749znz05lnl2zxwy66lvxemxdhtpvr5kh7tea8nrew48qt25tjf8ank9dwty2hf06dttp4sxfz90a0mq6u3u0f8h00pl5wlh2jvmpn6cymv0kstzmm8vw0ej408jm2h68xlmlu3lxzqcr4q333j3dgp6l0lskdhu0hjlpm6djr75duff5kannl7897tglhan38nadmumw0ng40rj20uqkr4p48a2ax77mk088ekxx6h6c6a4nafy2eadhzteej07ls6el7fhheackkjdyuncs2k0zyf0mwer59n05s2hz9rdz4l8nnkd3sjk4tremwtjw5mf82n45w57rec06a2ejft83rmz6wmawfxl4nazg6x4lutkh0vv6979y5psq2q0hlfscgd2p5",
  })
  private inputOfferText!: string;
  // @Prop() private inputOfferText!: string;
  public offerText = "";
  public offerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public submitting = false;
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public step: "Input" | "Confirmation" = "Input";

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

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  async mounted(): Promise<void> {
    if (this.inputOfferText) {
      this.offerText = this.inputOfferText;
      this.updateOffer();
    }
    await this.loadCoins();
  }

  async updateOffer(): Promise<void> {
    this.offerBundle = null;
    this.offerBundle = await decodeOffer(this.offerText);
    this.summary = null;
    this.summary = await getOfferSummary(this.offerBundle);
  }

  async loadCoins(): Promise<void> {
    if (!this.tokenPuzzles || this.tokenPuzzles.length == 0) {
      this.tokenPuzzles = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      this.availcoins = await coinHandler.getAvailableCoins(this.tokenPuzzles, coinHandler.getTokenNames(this.account));
    }
  }

  async sign(): Promise<void> {
    if (!this.availcoins || !this.tokenPuzzles || !this.account.firstAddress || !this.summary || !this.offerBundle) {
      return;
    }

    try {
      this.signing = true;

      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      const revSummary = getReversePlan(this.summary, change_hex);
      // console.log("reverse summary generated", revSummary);

      const offered: OfferEntity[] = revSummary.offered.map((_) => Object.assign({}, _, { symbol: this.cats[_.id] }));
      // console.log("offered", offered);

      const offplan = await generateOfferPlan(offered, change_hex, this.availcoins, 0n);
      // console.log("off plan", offplan);
      const bundle = await generateOffer(offplan, revSummary.requested, this.tokenPuzzles);
      const combined = await combineSpendBundle([this.offerBundle, bundle]);
      this.bundle = combined;

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

  async submit(): Promise<void> {
    //
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

<style scoped lang="scss">
ol.token-list {
  margin-left: 2em;
}
</style>
