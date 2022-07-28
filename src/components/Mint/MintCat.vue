<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("mintCat.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div v-show="!bundle">
        <address-field
          :inputAddress="address"
          :addressEditable="addressEditable"
          @updateAddress="updateAddress"
          @updateContactName="updateContactName"
        ></address-field>
        <token-amount-field
          v-model="amount"
          :selectedToken="selectedToken"
          :token-names="tokenNames"
          :fee="fee"
          :label="$t('mintCat.ui.label.amount')"
          :max-amount="maxAmount"
          :total-amount="totalAmount"
          @input="updateTokenAmount"
          @change-token="changeToken"
          @validity="changeValidity"
          @set-max="setMax()"
        >
        </token-amount-field>
        <b-field :label="$t('mintCat.ui.label.memo')">
          <b-input maxlength="100" v-model="memo" type="text" @input="reset()"></b-input>
        </b-field>
        <b-field :label="$t('mintCat.ui.label.symbolName')">
          <b-input maxlength="12" v-model="symbol" type="text" @input="reset()" required></b-input>
        </b-field>
        <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      </div>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($t('mintCat.ui.summary.notification'))"></span>
        </b-notification>
        <send-summary
          :amount="numericAmount"
          :unit="symbol.toUpperCase()"
          :fee="feeBigInt"
          :address="address"
          :asset-id="assetId"
          :leadingText="$t('mintCat.ui.summary.label.leadingText')"
          :total="total"
          :contactName="contactName"
        ></send-summary>
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-block">
      <div>
        <b-button :label="$t('mintCat.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="$t('mintCat.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="sign()"
          :disabled="!validity || submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('mintCat.ui.button.submit')"
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
import { AccountEntity, CustomCat, TokenInfo } from "@/models/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { SpendBundle } from "@/models/wallet";
import bigDecimal from "js-big-decimal";
import ScanQrCode from "@/components/ScanQrCode.vue";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";
import BundleSummary from "../BundleSummary.vue";
import SendSummary from "../SendSummary.vue";
import { generateMintCatBundle } from "@/services/mint/cat";
import { chainId, xchPrefix, xchSymbol } from "@/store/modules/network";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import { getTokenInfo } from "@/services/coin/cat";
import AddressField from "../AddressField.vue";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    AddressField,
  },
})
export default class MintCat extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() private tokenList!: CustomCat[];
  public addressEditable = true;
  public submitting = false;
  public fee = 0;
  public address = "";
  public memo = "";
  public contactName = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectMax = false;
  public amount = "";
  public symbol = "NEWTOKEN";
  public selectedToken = xchSymbol();
  public validity = false;
  public assetId = "";
  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    this.loadCoins();
    this.address = this.account.firstAddress ?? "";
  }

  @Emit("close")
  close(): void {
    return;
  }

  get isLegalSymbol(): boolean {
    for (let t of this.tokenList) {
      if (t.name.toUpperCase() === this.symbol.toUpperCase()) {
        return false;
      }
    }
    return true;
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get tokenNames(): string[] {
    return [xchSymbol()];
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get numericAmount(): bigint {
    const decimal = 12;
    return BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));
  }

  get feeBigInt(): bigint {
    return BigInt(this.fee);
  }

  get total(): bigint {
    return this.feeBigInt + this.numericAmount;
  }

  get network(): string {
    return store.state.network.networkId;
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

  setMax(excludingFee = false): void {
    this.reset();
    excludingFee = this.selectedToken != xchSymbol() ? true : excludingFee;
    const newAmount = excludingFee
      ? this.maxAmount
      : bigDecimal.subtract(this.maxAmount, bigDecimal.divide(this.fee, Math.pow(10, this.decimal), this.decimal));
    this.amount = newAmount;
    this.selectMax = true;
  }

  updateTokenAmount(value: string): void {
    this.amount = value;
    this.reset();
    this.selectMax = false;
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
    this.amount = "0";
    this.selectMax = false;
    this.maxStatus = "Loading";

    if (!this.requests || this.requests.length == 0) {
      this.requests = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      this.availcoins = await coinHandler.getAvailableCoins(this.requests, this.tokenNames);
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

      if (!this.isLegalSymbol) {
        this.submitting = false;
        Notification.open({
          message: this.$tc("mintCat.ui.messages.tokenNameUnavailable"),
          type: "is-danger",
        });
        return;
      }

      const decimal = this.selectedToken == xchSymbol() ? 12 : 3;
      const amount = BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));

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

      const { spendBundle, assetId } = await generateMintCatBundle(
        this.address,
        this.account.firstAddress,
        amount,
        BigInt(this.fee),
        this.memo,
        this.availcoins,
        this.account.key.privateKey,
        this.requests,
        xchSymbol(),
        chainId(),
        "cat_v2"
      );

      this.bundle = spendBundle;
      this.assetId = assetId;
    } catch (error) {
      Notification.open({
        message: this.$tc("mintCat.ui.messages.failedToSign") + error,
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
    submitBundle(this.bundle, (_) => (this.submitting = _), this.success);
  }

  async success(): Promise<void> {
    this.close();
    this.account.allCats.push({ name: this.symbol.toUpperCase(), id: this.assetId, network: this.network });
    this.account.addressGenerated = 0;
    await store.dispatch("persistent");
    await store.dispatch("refreshBalance");
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  scanQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ScanQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.reset();
          this.address = value;
        },
      },
    });
  }

  changeFee(): void {
    this.reset();
    if (this.selectMax) this.setMax();
  }
}
</script>

<style scoped lang="scss"></style>
