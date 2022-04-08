<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offer.take.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field :label="$t('offer.take.ui.field.offer')" :message="offerText ? '' : $t('offer.take.ui.hint.pasteOffer')">
          <b-input type="textarea" v-model="offerText" @input="updateOffer()"></b-input>
        </b-field>
        <b-field v-if="summary" :label="$t('offer.take.ui.panel.information')">
          <template #message>
            <ul v-for="(arr, sumkey) in summary" :key="sumkey" :class="sumkey">
              <li v-if="sumkey == 'requested'">{{ $t("offer.take.information.requested") }}</li>
              <li v-if="sumkey == 'offered'">{{ $t("offer.take.information.offered") }}</li>
              <li>
                <ol class="token-list">
                  <li class="pt-1" v-for="(ent, idx) in arr" :key="idx">
                    <b-taglist attached>
                      <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                        cats[ent.id]
                      }}</b-tag>
                      <b-tag v-else-if="ent.id" type="is-info" :title="ent.id"
                        >{{ $t("offer.symbol.Cat") }} {{ ent.id.slice(0, 7) + "..." }}</b-tag
                      >
                      <b-tag v-else type="is-info" :title="$t('offer.symbol.hint.XCH')">{{ $t("offer.symbol.XCH") }}</b-tag>

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
            {{ $t("offer.take.ui.label.bundle") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
            <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
          </template>
          <b-input type="textarea" disabled :value="bundleJson"></b-input>
        </b-field>
      </template>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('offer.take.ui.button.cancel')" @click="close()"></b-button>
        <b-button v-if="!bundle" type="is-success" @click="sign()">
          {{ $t("offer.take.ui.button.sign") }}
          <b-loading :is-full-page="false" :active="!tokenPuzzles || !availcoins"></b-loading>
        </b-button>
      </div>
      <div>
        <b-button
          :label="$t('offer.take.ui.button.submit')"
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
import { debugBundle, submitBundle } from "@/services/view/bundle";

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo },
})
export default class TakeOffer extends Vue {
  @Prop() private account!: AccountEntity;
  // @Prop({ default: "offer1qqp83w76wzru6cmqvpsxygqqgtz8czhc9m7htaj54ten8j0925a2n80flhclm8y8lshnwepyfuud2rjnqu9ad5t6d66fuxaduarwhww30fh2p6eewzcm0g8gm6q6ga5l9wt40mvck3syykk8cf6cak5vnself3989uk9s7arl08pm29j8syaza7x97wa8uu7nqhartj4nmpuhgfkgxj7rj0pptuh0hjxwhfdn5zzwj6waprhayvzzvstkmhwy96gnrhrww0ucvdnhjde2deavetuka6gmuztlmthuse576dwgh4qjgyh2e7vrmzamxujwerhvymlmwxlgm40cqhw0s9dgxljtaeflny45vcdvsuyz3fqawhwf3ahfx7evh8uh7nh5al39tc7jh6m3h6hdwqemvrycwn7uaudgfckgfnyp6m2062v573c77auzpn0mpl23glattdra2279yjer8kl8u6g8kx6wluvetxdmtpvruhh6tfhxmzezkhgtzjt6t8mj7xdk25wkew6pttd5qzf68l30mr6ujv0gln0tpl70832z0mpnjcy0vl53nxml8uyweh4h9z420l87atcyyaqxygmrnqx23nl7l7pa2587lm5xkkkxe8zskwy64lytcywja2l5a4a25q66swvhl2gdm0qwuqg44l0s23zj9v5ful0s97xvfgh3w2795awuch4rkrnvd04t9hgm8ha6vtte57m6tececa4jytujlc5zc7z86c4tfv74jnz2764ze8wmxml9jlnnva7ap80nxmd8xpwmyla77kdsgv5y5tevmwnyreag7z9wlfwefjfwyqrug4c2cuc00dv", })
  // private inputOfferText!: string;
  @Prop() private inputOfferText!: string;
  public offerText = "";
  public makerBundle: SpendBundle | null = null;
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
    this.makerBundle = null;
    this.makerBundle = await decodeOffer(this.offerText);
    this.summary = null;
    this.summary = await getOfferSummary(this.makerBundle);
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
    if (!this.availcoins || !this.tokenPuzzles || !this.account.firstAddress || !this.summary || !this.makerBundle) {
      return;
    }

    try {
      this.signing = true;

      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      const revSummary = getReversePlan(this.summary, change_hex);
      const offered: OfferEntity[] = revSummary.offered.map((_) => Object.assign({}, _, { symbol: this.cats[_.id] }));
      const offplan = await generateOfferPlan(offered, change_hex, this.availcoins, 0n);
      const takerBundle = await generateOffer(offplan, revSummary.requested, this.tokenPuzzles);
      const combined = await combineSpendBundle([this.makerBundle, takerBundle]);
      // for creating unit test
      // console.log("const change_hex=", change_hex, ";");
      // console.log("const bundle=", JSON.stringify(combined, null, 2), ";");
      this.bundle = combined;

      this.step = "Confirmation";
    } catch (error) {
      Notification.open({
        message: this.$tc("offer.take.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.signing = false;
    }

    this.signing = false;
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, (_) => (this.submitting = _), this.close);
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }
}
</script>

<style scoped lang="scss">
ol.token-list {
  margin-left: 2em;
}
</style>
