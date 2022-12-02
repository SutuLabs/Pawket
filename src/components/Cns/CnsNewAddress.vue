<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <!-- <p class="modal-card-title">{{ $t("mintNft.ui.title") }}</p> -->
      <p class="modal-card-title">New Address</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div v-show="!bundle">
        <address-field
          :inputAddress="address"
          label="Registered Address"
          :addressEditable="addressEditable"
          @updateAddress="updateAddress"
          @updateContactName="updateContactName"
        ></address-field>

        <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      </div>
      <template v-if="bundle">
        <buy-cns-summary
          :domainName="domainName"
          :nftHash="hash"
          :fee="feeBigInt"
          :address="address"
          :total="total"
          :contactName="contactName"
        ></buy-cns-summary>
        <bundle-summary :account="account" :bundle="bundle" :ignoreError="true"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button class="is-pulled-left" :label="$t('mintNft.ui.button.cancel')" @click="cancel()"></b-button>
        <b-button
          :label="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
          v-if="!bundle"
          type="is-primary"
          class="is-pulled-left"
          @click="sign()"
          :disabled="!validity || submitting"
        ></b-button>
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
    <b-loading :is-full-page="false" v-model="submitting"></b-loading>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { AccountEntity, TokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { CnsDetail, TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import bigDecimal from "js-big-decimal";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import { networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getTokenInfo } from "@/services/view/cat";
import { generateTransferNftBundle } from "@/services/coin/nft";
import AddressField from "@/components/Common/AddressField.vue";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import BuyCnsSummary from "@/components/Cns/BuyCnsSummary.vue";
import { Hex, prefix0x } from "@/services/coin/condition";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    AddressField,
    BuyCnsSummary,
  },
})
export default class BuyCns extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public cns!: CnsDetail;
  @Prop() public domainName!: string;

  public addressEditable = true;
  public submitting = false;
  public fee = 0;
  public address = "";
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
    this.loadCoins();
    this.address = this.account.firstAddress ?? "";
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

  get hash(): string | undefined {
    return this.cns?.metadata.hash;
  }

  get uri(): string | undefined {
    return this.cns?.metadata.uri;
  }

  reset(): void {
    this.bundle = null;
  }

  updateAddress(value: string): void {
    this.address = value;
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
      this.requests = this.account.type == "PublicKey" ? [] : await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await coinHandler.getAvailableCoins(
        await coinHandler.getAssetsRequestObserver(this.account),
        coinHandler.getTokenNames(this.account)
      );
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
        Bytes.from(bech32m.decodeToBytes(this.address).bytes).hex();
      } catch (error) {
        Notification.open({
          message: this.$tc("send.messages.error.INVALID_ADDRESS"),
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      if (!this.address.startsWith(xchPrefix())) {
        Notification.open({
          message: this.$tc("send.messages.error.ADDRESS_NOT_MATCH_NETWORK"),
          type: "is-danger",
          duration: 5000,
        });
        this.submitting = false;
        return;
      }

      const observers = await coinHandler.getAssetsRequestObserver(this.account);

      const ubundle = await generateTransferNftBundle(
        this.address,
        this.account.firstAddress,
        BigInt(this.fee),
        this.cns.coin,
        this.cns.analysis,
        this.availcoins,
        observers,
        networkContext()
      );

      this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());
      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
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
    submitBundle(this.bundle, (_) => (this.submitting = _), this.close);

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
