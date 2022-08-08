<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("offer.take.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field
          :label="$t('offer.take.ui.field.offer')"
          :type="parseError == 'error' ? 'is-danger' : ''"
          :message="
            offerText ? (parseError == 'error' ? $t('offer.take.ui.hint.error') : '') : $t('offer.take.ui.hint.pasteOffer')
          "
        >
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
                    <div class="columns">
                      <div class="column">
                        <b-taglist attached class="mb-0">
                          <template v-if="ent.id && ent.nft_target">
                            <b-tag type="is-info" class="nft-tag" :title="getNftName(ent.id)">{{ getNftName(ent.id) }}</b-tag>
                          </template>
                          <template v-else-if="ent.id">
                            <b-tag v-if="ent.id && cats[ent.id]" type="is-info" :title="cats[ent.id] + ' (' + ent.id + ')'">{{
                              cats[ent.id]
                            }}</b-tag>
                            <a v-else-if="ent.id" @click="ManageCats(ent.id)">
                              <b-tag type="is-info" :title="ent.id">
                                {{ $t("offer.symbol.Cat") }} {{ ent.id.slice(0, 7) + "..." }}</b-tag
                              >
                            </a>
                          </template>

                          <template v-else>
                            <b-tag type="is-info" :title="$t('offer.symbol.hint.XCH')">{{ xchSymbol }}</b-tag>
                          </template>

                          <b-tag v-if="!ent.nft_target" class="" :title="ent.amount + ' mojos'">{{
                            ent.amount | demojo(ent.id && tokenInfo[cats[ent.id]])
                          }}</b-tag>

                          <b-tag v-if="sumkey == 'requested'" type="is-info is-light" :title="getAddress(ent.target)">
                            <key-box :value="getAddress(ent.target)" :showValue="true"></key-box>
                          </b-tag>
                        </b-taglist>
                        <a v-if="ent.id && !ent.nft_target && !cats[ent.id]" @click="ManageCats(ent.id)">
                          <span v-if="ent.id && !cats[ent.id]" class="pl-1 pt-0 is-size-8 has-text-danger is-inline-block">
                            {{ $t("offer.take.information.addCat") }}
                          </span>
                        </a>
                      </div>
                      <div v-if="ent.nft_uri" class="column">
                        <a :href="ent.nft_uri" target="_blank">
                          <b-tooltip :label="ent.nft_uri" multilined class="break-string" position="is-left">
                            <img :src="ent.nft_uri" class="nft-image" />
                          </b-tooltip>
                        </a>
                      </div>
                    </div>
                  </li>
                </ol>
              </li>
            </ul>
          </template>
        </b-field>
        <fee-selector v-if="debugMode && summary" v-model="fee"></fee-selector>
      </template>
      <template v-if="step == 'Confirmation'">
        <b-field v-if="bundle">
          <template #label>
            {{ $t("offer.take.ui.label.bundle") }}
            <key-box icon="checkbox-multiple-blank-outline" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
            <b-button tag="a" class="mr-2" icon-left="qrcode" size="is-small" @click="showQrCode()"> </b-button>
            <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
          </template>
          <b-input type="textarea" disabled :value="bundleJson"></b-input>
        </b-field>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="$t('offer.take.ui.button.cancel')" class="is-pulled-left" @click="close()"></b-button>
        <b-button v-if="!bundle" type="is-primary" class="is-pulled-right" @click="sign()">
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
import { AccountEntity, CustomCat, TokenInfo } from "@/models/account";
import { demojo } from "@/filters/unitConversion";
import { SymbolCoins } from "@/services/transfer/transfer";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import coinHandler from "@/services/transfer/coin";
import { getOfferSummary, OfferSummary } from "@/services/offer/summary";
import { decodeOffer } from "@/services/offer/encoding";
import { NotificationProgrammatic as Notification } from "buefy";
import { combineSpendBundle, generateNftOffer, generateOffer, generateOfferPlan, getReversePlan } from "@/services/offer/bundler";
import { prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import store from "@/store";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";
import ManageCats from "@/components/ManageCats.vue";
import OfflineSendShowBundle from "../OfflineSendShowBundle.vue";
import { chainId, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getLineageProofPuzzle } from "@/services/transfer/call";

@Component({
  components: {
    KeyBox,
    FeeSelector,
  },
  filters: { demojo },
})
export default class TakeOffer extends Vue {
  @Prop() private account!: AccountEntity;
  // @Prop({
  //   default:
  //     "offer1qqz83wcsltt6wcmqvpsxygqqwc7hynr6hum6e0mnf72sn7uvvkpt68eyumkhelprk0adeg42nlelk2mpafs8tkhg2qa9qmzphgzr85cmhln3ntar8v8razh2j3ejucf6za70898u9xhcd72hs02gr2t3q80hdpvmjtcl7g3nhjfnd65x239r7hmth4x6z0nw5u0fldxrnv7c9g0lnvvyuy9ppnjqsfgnlltt2m40len3smh0mvjtzwax53xwd60dfdeugk2h85ggs5jskuepg4tec53pjglyewll3hy7nfpgn80n265sv6lc2clknc3e420l8upyxs9pncwdargcjq8uakddrzvq6xycplur0s3qpy4kzl227vs2mell0c5r0wnnnkfkm4yh9hmau37yyluyfxkt340dust4k6hxla04qu4x96fvty990ntmx3cpzdu40lnm7zxxtfmd78pgd5chsghw4pu4e4d0pljr4xfxwsxzsx6xl72xdv8zmtankg46uwk4h4hvn3t90e9uu845t5ym2z4e7qvf6l4qf5pp38t7rzldxrlqqjlkpq00lncr9lusy4mquphm0manvv89kke54tj6jekt9m58s9ljeulygwc8c506laq9q3jff9qmr9d70eaxj7n6dfgmuhn6vey5v6vjtentulnj29j5zjt70fgkys2x54hyjln7femxdzt7vehxy7n2k9l95lj3kehxa2nw060zu3yrdegkv5jj0609us278tgp2xgtne5e70ffex72rw46ah3h4sdr0ah3ahh2htlllpxqezef7taw64x8en0llal4xtkslgpf3ad9d92etft956nftxwfh8r2jedxvmyu2fv9fxucnzv4ghv622deh9v6t2v4g55uv7welyucj6g4fx5h4z29uk5cjedf0fu6jf06lygm4wh7mes7d3kwf6lydwkpv45uuw073mscun5em6zjayg40m8frxgpf9slacvwyhjajsx8xhjsqt2ws9vee9yc26vefx5et62eckz4j9dx48j6jzdkk5jkjfwe4xzj23t9jhrxd6ffx4z4jk2x89z6qe6xcc42txm2j7t9geax2h5p390xvs26k909ukjfw9yhuyfstr68yvhnkt6hxv5n20ec55l4pffdysykzhnhrqxgzftfprenz6ut33lv9jwxeel2lfl2mv8eua4a636dj4hmvwl20ce0a0yn7kk5edpaepu3jzu56fwmxtual0cl45p89knjn4tvmkrnwkng0pzaf06a7nmpl7lz7raqqkzyll4l9ajntl6x3940lhchxuur4fhf7w4nd0da43gndn89ht6uneu7j73hjef82arxpgjl8rxwfjxuunq3wr8ll5ve993w8zf7xdfepvh0ar49090t2uc53pagma0hpc4u6w5heza09hfp20ehru9z4dkmw3846rdzp3tgag04ffrkw7zxvauqdlgvealn4aa7z6zz2mvev4dthe2r3j8gsjxswm7e6un4sld9um4fehgjsy3cvm6lftqag3v38vczepus6w9j66cd6ucpxeuv8qjhwwllnh5gh3m0mxw8h7faafh0tzza97fjp6ktqz0z7juz8ekmtp4hnpyfg9m787wzn32u9fjv8tx3dvzjkyqet7hl0aq7pu3eelvzd6zey7chh8mhwmy4afljtzjmve9l73xfhqhd8kavy56wle0kqf5hm6cysak00hysx8c0cew3z4mke9kf3fmlhaexrafk67948pykdcptkrp57sz8vv9s0yrv468q7y0w8lctpqxm4qn5zp2qfnmqd5ajaeadpulatkuudcmr24h0yr87ldt4ek8egu5n6jmel84gjpf8tm8x6nn087jtnvm8knreksah35fptxq36htzzvk38l3ualke59wyl92lpc885nnukg7t9uay2m43ekwlw60n0ayklj7c8e4l6je8ka0xf5tvtvpqpp6pcsss00l0pg",
  // })
  // private inputOfferText!: string;
  @Prop() private inputOfferText!: string;
  @Prop() tokenList!: CustomCat[];
  public offerText = "";
  public makerBundle: SpendBundle | null = null;
  public summary: OfferSummary | null = null;
  public submitting = false;
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public step: "Input" | "Confirmation" = "Input";
  public fee = 0;
  public parseError = "";

  @Emit("close")
  close(): void {
    return;
  }

  get cats(): { [id: string]: string } {
    return getCatNameDict(this.account);
  }

  get network(): string {
    return store.state.network.networkId;
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

  get xchSymbol(): string {
    return xchSymbol();
  }

  async mounted(): Promise<void> {
    if (this.inputOfferText) {
      this.offerText = this.inputOfferText;
      this.updateOffer();
    }
    await this.loadCoins();
  }

  async refresh(): Promise<void> {
    this.tokenPuzzles = [];
    this.availcoins = null;
    await this.loadCoins();
  }

  async updateOffer(): Promise<void> {
    try {
      this.parseError = "";
      this.makerBundle = null;
      this.makerBundle = await decodeOffer(this.offerText);
      this.summary = null;
      this.summary = await getOfferSummary(this.makerBundle);
    } catch (err) {
      this.parseError = "error";
      this.makerBundle = null;
      this.summary = null;
    }
    this.fee = 0;
  }

  get isNftOffer(): boolean {
    return !!this.summary && (this.summary.requested.some((_) => _.nft_target) || this.summary.offered.some((_) => _.nft_target));
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

      if (!this.isNftOffer) {
        const isReceivingCat = !this.summary.requested[0].id;

        const revSummary = getReversePlan(this.summary, change_hex, this.cats);
        if (!isReceivingCat) {
          const reqamt = revSummary.requested[0].amount;
          const fee = BigInt(this.fee);
          if (reqamt < fee) {
            throw new Error(`Not enough ${xchSymbol} for fee`);
          }
          revSummary.requested[0].amount -= fee;
        }
        const fee = isReceivingCat ? BigInt(this.fee) : 0n;
        const offplan = await generateOfferPlan(revSummary.offered, change_hex, this.availcoins, fee, xchSymbol());
        const takerBundle = await generateOffer(
          offplan,
          revSummary.requested,
          this.tokenPuzzles,
          getLineageProofPuzzle,
          xchSymbol(),
          chainId()
        );
        const combined = await combineSpendBundle([this.makerBundle, takerBundle]);
        // for creating unit test
        // console.log("const change_hex=", change_hex, ";");
        // console.log("const bundle=", JSON.stringify(combined, null, 2), ";");
        this.bundle = combined;
      } else {
        const revSummary = getReversePlan(this.summary, change_hex, this.cats);
        const fee = BigInt(this.fee);
        const nft = revSummary.requested[0].nft_detail;
        if (!nft) throw new Error("Cannot find NFT");

        // royalty_amount = uint64(offered_amount * royalty_percentage / 10000)
        const royalty_amount = (revSummary.offered[0].amount * BigInt(nft.analysis.tradePricePercentage)) / BigInt(10000);
        const offplan = await generateOfferPlan(
          revSummary.offered,
          change_hex,
          this.availcoins,
          fee,
          xchSymbol(),
          royalty_amount
        );
        const takerBundle = await generateNftOffer(
          offplan,
          nft.analysis,
          undefined,
          revSummary.requested,
          this.tokenPuzzles,
          getLineageProofPuzzle,
          xchSymbol(),
          chainId()
        );
        const combined = await combineSpendBundle([this.makerBundle, takerBundle]);
        // for creating unit test
        // console.log("const change_hex=", change_hex, ";");
        // console.log("const bundle=", JSON.stringify(combined, null, 2), ";");
        this.bundle = combined;
      }
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

  getNftName(hex: string): string {
    return puzzle.getAddressFromPuzzleHash(hex, "nft");
  }

  getAddress(hex: string): string {
    return puzzle.getAddressFromPuzzleHash(hex, xchPrefix());
  }

  ManageCats(id: string): void {
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { account: this.account, defaultAssetId: id, activeTab: 1 },
      events: { refresh: this.refresh },
    });
  }

  showQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineSendShowBundle,
      hasModalCard: true,
      trapFocus: false,
      props: { bundle: this.bundle },
    });
  }
}
</script>

<style scoped lang="scss">
ol.token-list {
  margin-left: 2em;
}
img.nft-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border: 1px solid;
}
.break-string {
  word-break: break-word;
}
.nft-tag ::v-deep span {
  text-overflow: ellipsis;
  max-width: 100px;
  overflow: hidden;
  white-space: nowrap;
}
</style>
