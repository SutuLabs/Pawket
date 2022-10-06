<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Move NFT</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <template v-if="step == 'Input'">
        <b-field label="Move To Profile">
          <b-dropdown v-model="selectedDid">
            <template #trigger>
              <b-button :label="selectedDid ? selectedDid.name : 'Select DID'" icon-right="menu-down" />
            </template>

            <b-dropdown-item v-for="did in dids" :key="did.did" :value="did">{{ did.name }}</b-dropdown-item>
          </b-dropdown>
        </b-field>
        <b-field label="NFT">
          <b-input :value="nft.address" disabled></b-input>
        </b-field>
        <b-field>
          <img v-if="nft.metadata.uri" :src="nft.metadata.uri" class="image is-64x64" />
          <img v-else src="@/assets/nft-no-image.png" class="image is-64x64" />
          <span class="pl-2 has-text-grey"
            ><p>{{ nft.metadata.name }}</p>
          </span>
        </b-field>
        <fee-selector v-model="fee"></fee-selector>
      </template>
      <template v-if="step == 'Confirmation'">
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
          {{ $t("offer.make.ui.button.sign") }}
        </b-button>
      </div>
      <div>
        <b-button
          :label="$t('mintNft.ui.button.submit')"
          v-if="bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import { AccountEntity } from "@/models/account";
import store from "@/store";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { SymbolCoins } from "@/services/transfer/transfer";
import { DidDetail, NftDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { getOfferSummary, OfferSummary } from "@/services/offer/summary";
import { decodeOffer } from "@/services/offer/encoding";
import { chainId, xchSymbol } from "@/store/modules/network";
import { getLineageProofPuzzle } from "@/services/transfer/call";
import { submitBundle } from "@/services/view/bundle";
import { generateTransferNftBundle } from "@/services/coin/nft";
import FeeSelector from "@/components/Send/FeeSelector.vue";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
    FeeSelector,
  },
})
export default class NftMove extends Vue {
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
  public submitting = false;
  public selectedDid: DidDetail | null = null;
  public fee = 0n;

  get dids(): DidDetail[] {
    return this.account.dids || [];
  }

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
    this.signing = true;
    try {
      if (!this.account.firstAddress) {
        this.signing = false;
        return;
      }

      if (!this.selectedDid) {
        this.signing = false;
        return;
      }

      if (this.availcoins == null) {
        this.signing = false;
        return;
      }

      const spendBundle = await generateTransferNftBundle(
        this.account.firstAddress,
        this.account.firstAddress,
        BigInt(this.fee),
        this.nft.coin,
        this.nft.analysis,
        this.availcoins,
        this.tokenPuzzles,
        xchSymbol(),
        chainId(),
        getLineageProofPuzzle,
        this.selectedDid.analysis
      );

      this.bundle = spendBundle;
      this.step = "Confirmation";
    } catch (error) {
      Notification.open({
        message: this.$tc("mintNft.ui.messages.failedToSign") + error,
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

    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
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
