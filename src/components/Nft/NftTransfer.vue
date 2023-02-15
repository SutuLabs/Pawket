<template>
  <confirmation
    :value="bundle"
    :title="$t('nftTransfer.ui.title')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    :signBtn="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
    @cancel="cancel()"
    @confirm="submit()"
    :showClose="true"
    :loading="submitting"
    :disabled="!validity || submitting"
    :submitting="submitting"
  >
    <template #sign>
      <div>
        <div class="has-text-centered">
          <p class="has-text-grey pb-3">{{ $t("nftTransfer.ui.description") }}</p>
          <img v-if="uri" :src="uri" class="image is-128x128" />
          <img v-else src="@/assets/nft-no-image.png" class="image is-128x128" />
          <p>{{ nft.name }}</p>
        </div>
        <address-field
          :inputAddress="address"
          :addressEditable="addressEditable"
          @updateAddress="updateAddress"
          @updateEffectiveAddress="updateEffectiveAddress"
          @updateContactName="updateContactName"
        ></address-field>

        <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      </div>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('nftTransfer.ui.summary.confirmation'))"></span>
      </b-notification>
      <send-summary
        :nftUri="uri"
        :nftHash="hash"
        :fee="feeBigInt"
        :address="signAddress"
        :leadingText="$t('mintNft.ui.summary.label.leadingText')"
        :total="total"
        :contactName="contactName"
      ></send-summary>
      <bundle-summary :account="account" :bundle="bundle" :ignoreError="true" class="mt-3"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { AccountEntity, TokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { NftDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import bigDecimal from "js-big-decimal";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getTokenInfo } from "@/services/view/cat";
import { generateTransferNftBundle } from "@/services/coin/nft";
import AddressField from "@/components/Common/AddressField.vue";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import Confirmation from "../Common/Confirmation.vue";
import { Hex, prefix0x } from "@/services/coin/condition";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoinsWithRequests } from "@/services/view/coinAction";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    AddressField,
    Confirmation,
  },
})
export default class NftTransfer extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public nft!: NftDetail;
  @Prop() public inputAvailableCoins!: SymbolCoins;
  @Prop() public inputAddress!: string;
  @Prop({ default: true }) public addressEditable!: boolean;
  @Prop() public inputRequests!: TokenPuzzleDetail[];

  public submitting = false;
  public fee = 0;
  public address = "";
  public signAddress = "";
  public contactName = "";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectedToken = xchSymbol();
  public validity = false;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    if (this.inputAvailableCoins && this.inputRequests) {
      this.availcoins = this.inputAvailableCoins;
      this.requests = this.inputRequests;
    }
    if (this.inputAddress) this.address = this.inputAddress;
    this.loadCoins();
  }

  @Emit("close")
  close(): void {
    return;
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  get symbol(): string {
    return xchSymbol();
  }

  get feeBigInt(): bigint {
    return BigInt(this.fee);
  }

  get total(): bigint {
    return this.feeBigInt + 1n;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  reset(): void {
    this.bundle = null;
  }

  updateAddress(value: string): void {
    this.address = value;
    this.reset();
  }

  updateEffectiveAddress(value: string): void {
    this.signAddress = value;
    this.reset();
  }

  updateContactName(value: string): void {
    this.contactName = value;
  }

  cancel(): void {
    if (this.bundle) {
      this.reset();
    } else {
      this.close();
    }
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  get hash(): string | undefined {
    return this.nft?.metadata.hash;
  }

  get uri(): string | undefined {
    return this.nft?.metadata.uri;
  }

  changeToken(token: string): void {
    this.selectedToken = token;
    if (this.selectedToken == xchSymbol()) {
      this.memo = "";
    }
    this.reset();
    this.loadCoins();
  }

  changeValidity(valid: boolean): void {
    this.validity = valid;
    this.reset();
  }

  async loadCoins(): Promise<void> {
    this.bundle = null;
    this.maxAmount = "-1";
    this.totalAmount = "-1";
    this.maxStatus = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoinsWithRequests(this.account, this.requests);
      this.availcoins = coins[0];
    }

    if (!this.availcoins || !this.availcoins[this.selectedToken]) {
      return;
    }

    const availcoins = this.availcoins[this.selectedToken].map((_) => _.amount);

    this.totalAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );
    const singleMax = bigDecimal.divide(
      availcoins.reduce((a, b) => (a > b ? a : b), 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );
    if (this.selectedToken == xchSymbol()) {
      this.maxAmount = this.totalAmount;
      this.totalAmount = "-1";
    } else {
      this.maxAmount = singleMax;
    }
    this.maxStatus = "Loaded";

    this.changeValidity(true);
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (!this.account.firstAddress) {
        this.submitting = false;
        return;
      }

      if (this.availcoins == null) {
        this.submitting = false;
        return;
      }

      try {
        Bytes.from(bech32m.decodeToBytes(this.signAddress).bytes).hex();
      } catch (error) {
        Notification.open({
          message: this.$tc("send.messages.error.INVALID_ADDRESS"),
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      if (!this.signAddress.startsWith(xchPrefix())) {
        Notification.open({
          message: this.$tc("send.messages.error.ADDRESS_NOT_MATCH_NETWORK"),
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const observers = this.requests.length ? this.requests : await getAssetsRequestObserver(this.account);

      const ubundle = await generateTransferNftBundle(
        this.signAddress,
        this.account.firstAddress,
        BigInt(this.fee),
        this.nft.coin,
        this.nft.analysis,
        this.availcoins,
        observers,
        networkContext()
      );

      if (this.account.type == "PublicKey") {
        this.bundle = await signSpendBundle(ubundle, [], networkContext());
        await this.offlineSignBundle();
      } else {
        this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());
      }
    } catch (error) {
      Notification.open({
        message: this.$tc("mintNft.ui.messages.failedToSign") + error,
        type: "is-danger",
        autoClose: false,
      });
      console.warn(error);
      this.submitting = false;
    }
    this.submitting = false;
  }

  async submit(): Promise<void> {
    if (!this.bundle) return;
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.close);

    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  changeFee(): void {
    this.reset();
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

<style scoped lang="scss">
.image {
  margin: auto;
}
</style>
