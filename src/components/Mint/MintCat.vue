<template>
  <confirmation
    :value="bundle"
    :title="$t('mintCat.ui.title')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    @cancel="cancel()"
    @confirm="submit()"
    :signBtn="account.type == 'PublicKey' ? $t('common.button.generate') : 'Create Token'"
    :showClose="true"
    :loading="submitting"
    :disabled="!validity || submitting"
    :submitting="submitting"
  >
    <template #sign>
      <p class="pb-2">
        <a :href="`https://frodo.coinhabit.net/tutorial/tokens${experimentMode?'':'?b=1'}`" target="_blank">
          <b-tag icon="help-circle" size="is-small">Help</b-tag>
        </a>
      </p>
      <address-field
        :inputAddress="address"
        :addressEditable="addressEditable"
        @updateAddress="updateAddress"
        @updateEffectiveAddress="updateEffectiveAddress"
        @updateContactName="updateContactName"
      ></address-field>
      <token-amount-field
        v-model="amount"
        :selectedToken="selectedToken"
        :token-names="tokenNames"
        :fee="fee"
        :label="$t('mintCat.ui.label.amount')"
        :amount="amount"
        :max-amount="maxAmount"
        :total-amount="totalAmount"
        @input="updateTokenAmount"
        @change-token="changeToken"
        @validity="changeValidity"
        @set-max="setMax()"
      >
      </token-amount-field>
      <!--<b-field :label="$t('mintCat.ui.label.memo')">
        <b-input maxlength="100" v-model="memo" type="text" @input="reset()"></b-input>
      </b-field>-->
        {{ numTokens }} tokens to be created
      <b-field :label="$t('mintCat.ui.label.symbolName')">
        <b-input maxlength="12" v-model="symbol" type="text" @input="reset()" required></b-input>
      </b-field>
      <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('mintCat.ui.summary.notification'))"></span>
      </b-notification>
      <send-summary
        :amount="numericAmount"
        :unit="symbol.toUpperCase()"
        :fee="feeBigInt"
        :address="signAddress"
        :asset-id="assetId"
        :leadingText="$t('mintCat.ui.summary.label.leadingText')"
        :total="total"
        :contactName="contactName"
      ></send-summary>
      <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import { AccountEntity, CustomCat, TokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import bigDecimal from "js-big-decimal";
import { SymbolCoins } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { generateMintCatBundle } from "@/services/mint/cat";
import { chainId, ensureAddress, networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import { getTokenInfo } from "@/services/view/cat";
import AddressField from "@/components/Common/AddressField.vue";
import Confirmation from "../Common/Confirmation.vue";
import { Hex, prefix0x } from "@/services/coin/condition";
import { getAssetsRequestDetail, getAssetsRequestObserver, getAvailableCoins } from "@/services/view/coinAction";

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
export default class MintCat extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop() public tokenList!: CustomCat[];
  public addressEditable = true;
  public submitting = false;
  public fee = 0;
  public address = "";
  public signAddress = "";
  public memo = "";
  public contactName = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectMax = false;
  public amount = "0.000000000001";
  public symbol = "NEWTOKEN";
  public selectedToken = xchSymbol();
  public validity = false;
  public assetId = "";
  public requests: TokenPuzzleDetail[] = [];
  public numTokens = "0";

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  mounted(): void {
    this.loadCoins();
    this.address = ensureAddress(this.account.firstAddress);
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  @Emit("close")
  close(): void {
    if (this.path.endsWith("issue-cat")) this.$router.back();
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
    return chainId();
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
      this.$router.back();
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
    this.numTokens = bigDecimal.getPrettyValue(BigInt(bigDecimal.multiply(this.numericAmount, 1000)), 3, ",");
    this.selectMax = true;
  }

  updateTokenAmount(value: string): void {
    this.amount = value;
    this.numTokens = bigDecimal.getPrettyValue(BigInt(bigDecimal.multiply(this.numericAmount, 1000)), 3, ",");
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
      this.requests = this.account.type == "PublicKey" ? [] : await getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      const coins = await getAvailableCoins(this.account);
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

      const observers = await getAssetsRequestObserver(this.account);

      const { spendBundle, assetId } = await generateMintCatBundle(
        this.signAddress,
        this.account.firstAddress,
        amount,
        BigInt(this.fee),
        this.memo,
        this.availcoins,
        observers,
        networkContext(),
        "cat_v2"
      );

      this.bundle = await signSpendBundle(spendBundle, this.requests, networkContext());
      this.assetId = assetId;
      if (this.account.type == "PublicKey") {
        await this.offlineSignBundle();
      }
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
    submitBundle(this.bundle, this.account, (_) => (this.submitting = _), this.success);
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

  changeFee(): void {
    this.reset();
    if (this.selectMax) this.setMax();
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
