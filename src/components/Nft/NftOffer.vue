<template>
  <div class="modal-card">
    <top-bar :title="$t('offer.make.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field label="Offer">
          <b-input :value="nft.address" disabled></b-input>
        </b-field>
        <b-field>
          <img v-if="nft.metadata.uri" :src="nft.metadata.uri" class="image is-64x64" />
          <img v-else src="@/assets/nft-no-image.png" class="image is-64x64" />
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
        <b-button v-if="bundle" :label="$t('offer.make.ui.button.done')" class="is-pulled-left" @click="close()"></b-button>
        <b-button v-else :label="$t('common.button.cancel')" class="is-pulled-left" @click="close()"></b-button>
        <b-button v-if="!bundle" type="is-primary" :loading="signing" @click="sign()">
          {{ account.type == "PublicKey" ? $t("common.button.generate") : $t("common.button.sign") }}
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
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import { AccountEntity } from "@/models/account";
import store from "@/store";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { SymbolCoins } from "@/services/transfer/transfer";
import { NftDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { getOfferEntities, getOfferSummary, OfferEntity, OfferSummary, OfferTokenAmount } from "@/services/offer/summary";
import { decodeOffer, encodeOffer } from "@/services/offer/encoding";
import { networkContext, xchSymbol } from "@/store/modules/network";
import { Hex, prefix0x } from "@/services/coin/condition";
import puzzle from "@/services/crypto/puzzle";
import { generateNftOffer, generateOfferPlan } from "@/services/offer/bundler";
import dexie from "@/services/api/dexie";
import { tc } from "@/i18n/i18n";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";
import TopBar from "../Common/TopBar.vue";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
    TopBar,
  },
})
export default class NftOffer extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: NftDetail;

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
      this.tokenPuzzles = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoins(this.account);
      this.availcoins = coins[0];
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
          amount: 0n,
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
      const observers = await getAssetsRequestObserver(this.account);
      const ubundle = await generateNftOffer(offplan, this.nft.analysis, this.nft.coin, reqs, observers, networkContext());
      const bundle = await signSpendBundle(ubundle, this.tokenPuzzles, networkContext());
      this.bundle = bundle;
      this.offerText = await encodeOffer(bundle, 4);

      this.step = "Confirmation";

      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
      }
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
          if (this.bundle) this.bundle.aggregated_signature = prefix0x(sig);
        },
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
