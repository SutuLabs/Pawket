<template>
  <confirmation
    :value="bundle"
    :title="'Update CNS Address'"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    @cancel="cancel()"
    @confirm="submit()"
    :showClose="true"
    :loading="signing"
    :disabled="submitting"
    :submitting="submitting"
  >
    <template #sign>
      <b-field>
        <img v-if="nft.metadata.uri" :src="nft.metadata.uri" class="image is-64x64" />
        <img v-else src="@/assets/nft-no-image.png" class="image is-64x64" />
        <span class="pl-2 has-text-grey">
          <p>
            {{ nft.metadata.name }}
            <br />
            {{ currentAddress }}
          </p>
        </span>
      </b-field>
      <b-field label="Target Address">
        <b-input v-model="address"></b-input>
      </b-field>
      <fee-selector v-model="fee"></fee-selector>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('moveNft.ui.confirmation'))"></span>
      </b-notification>
      <div class="mb-3">
        <b-field>
          <template #label>
            <span class="is-size-6">{{ $t("moveNft.ui.label.move") }}</span>
            <span class="is-pulled-right">
              <img v-if="nft.metadata.uri" :src="nft.metadata.uri" class="nft-image" />
              <img v-else src="@/assets/nft-no-image.png" class="nft-image" />
            </span>
          </template>
        </b-field>
        <b-field>
          <template #label>
            <span class="is-size-6 has-text-grey">{{ $t("sendSummary.ui.label.fee") }}</span>
            <span class="is-size-6 is-pulled-right has-text-grey">
              {{ demojo(fee) }}
            </span>
          </template>
        </b-field>
      </div>
      <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import { AccountEntity, OneTokenInfo } from "@/models/account";
import store from "@/store";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { SymbolCoins } from "@/services/transfer/transfer";
import { CnsDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { submitBundle } from "@/services/view/bundle";
import { generateUpdatedNftBundle } from "@/services/coin/nft";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import { demojo } from "@/filters/unitConversion";
import { shorten } from "@/filters/addressConversion";
import BundleSummary from "../Bundle/BundleSummary.vue";
import Confirmation from "../Common/Confirmation.vue";
import puzzle from "@/services/crypto/puzzle";
import { prefix0x } from "@/services/coin/condition";

@Component({
  components: {
    KeyBox,
    TokenAmountField,
    FeeSelector,
    BundleSummary,
    Confirmation,
  },
})
export default class NftUpdate extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: CnsDetail;

  public bundle: SpendBundle | null = null;
  public step: "Input" | "Confirmation" = "Input";
  public availcoins: SymbolCoins | null = null;
  public tokenPuzzles: TokenPuzzleDetail[] = [];
  public signing = false;
  public submitting = false;
  public fee = 0n;
  public address = "";

  get currentAddress(): string {
    try {
      return puzzle.getAddressFromPuzzleHash(this.nft.analysis.cnsAddress, xchPrefix());
    } catch (err) {
      return "";
    }
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

  reset(): void {
    this.bundle = null;
    this.step = "Input";
  }

  cancel(): void {
    if (this.bundle) {
      this.reset();
    } else {
      this.close();
    }
  }

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  async mounted(): Promise<void> {
    this.address = this.currentAddress;
    await this.loadCoins();
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  shorten(name: string): string {
    return shorten(name);
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

  async sign(): Promise<void> {
    this.signing = true;
    try {
      if (!this.account.firstAddress) {
        this.signing = false;
        return;
      }

      if (this.availcoins == null) {
        this.signing = false;
        return;
      }

      const address_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
      const spendBundle = await generateUpdatedNftBundle(
        this.account.firstAddress,
        BigInt(this.fee),
        this.nft.coin,
        this.nft.analysis,
        "CNS",
        "address",
        address_hex,
        this.availcoins,
        this.tokenPuzzles,
        networkContext()
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

<style scoped lang="scss">
.break-string {
  word-break: break-word;
}
img.nft-image {
  width: 100px;
  height: 1.5rem;
  object-fit: cover;
  border: 1px solid;
}
</style>
