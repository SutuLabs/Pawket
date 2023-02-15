<template>
  <confirmation
    :value="bundle"
    :title="title ? title : $t('send.ui.title.send')"
    @close="close()"
    @back="cancel()"
    @sign="sign()"
    @cancel="cancel()"
    @confirm="offline ? showSend() : submit()"
    :sign-btn="account.type == 'PublicKey' ? $t('common.button.generate') : $t('common.button.sign')"
    :confirmBtn="offline ? $t('send.ui.button.showSend') : $t('send.ui.button.submit')"
    :showClose="showClose"
    :loading="submitting"
    :disabled="!validity || submitting"
    :submitting="submitting"
  >
    <template #sign>
      <b-notification
        v-if="notificationMessage"
        :type="notificationType || 'is-primary'"
        has-icon
        :icon="notificationIcon || 'heart'"
        :closable="notificationClosable"
      >
        {{ notificationMessage }}
      </b-notification>
      <address-field
        :inputAddress="address"
        :validAddress="validAddress"
        :addressEditable="addressEditable"
        @updateAddress="updateAddress"
        @updateEffectiveAddress="updateEffectiveAddress"
        @updateContactName="updateContactName"
      ></address-field>
      <token-amount-field
        v-model="amount"
        :rate="rate"
        :currency="currency"
        :selectedToken="selectedToken"
        :token-names="tokenNames"
        :fee="fee"
        :label="$t('send.ui.label.amount')"
        :amount-editable="amountEditable"
        :max-amount="maxAmount"
        :total-amount="totalAmount"
        :offline="offline"
        @input="updateTokenAmount"
        @change-token="changeToken"
        @validity="changeValidity"
        @set-max="setMax()"
      >
      </token-amount-field>
      <b-field :label="$t('send.ui.label.memo')">
        <b-input maxlength="100" v-model="memo" type="text" @input="reset()"></b-input>
        <!--<b-input maxlength="100" v-model="memo" type="text" @input="reset()" :disabled="selectedToken == xchSymbol"></b-input>-->
      </b-field>
      <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
    </template>
    <template #confirm>
      <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
        <span v-html="$sanitize($tc('send.ui.summary.notification'))"></span>
      </b-notification>
      <send-summary
        :amount="numericAmount"
        :unit="selectedToken"
        :fee="feeBigInt"
        :address="signAddress"
        :contactName="contactName"
      ></send-summary>
      <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
    </template>
  </confirmation>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from "vue-property-decorator";
import { AccountEntity, TokenInfo } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { signSpendBundle, SpendBundle } from "@/services/spendbundle";
import puzzle from "@/services/crypto/puzzle";
import bigDecimal from "js-big-decimal";
import { Hex, Hex0x, prefix0x } from "@/services/coin/condition";
import transfer, { SymbolCoins, TransferTarget } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import { debugBundle, submitBundle } from "@/services/view/bundleAction";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import OfflineSendShowBundle from "@/components/Offline/OfflineSendShowBundle.vue";
import { CurrencyType } from "@/services/exchange/currencyType";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { convertToChainId, networkContext, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getCatNames, getTokenInfo } from "@/services/view/cat";
import AddressField from "@/components/Common/AddressField.vue";
import TopBar from "@/components/Common/TopBar.vue";
import AddressBook, { Contact } from "@/components/AddressBook/AddressBook.vue";
import Confirmation from "../Common/Confirmation.vue";
import {
  getAssetsRequestDetail,
  getAssetsRequestObserver,
  getAvailableCoins,
  getAvailableCoinsWithRequests,
} from "@/services/view/coinAction";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    Confirmation,
    AddressField,
    TopBar,
  },
})
export default class Send extends Vue {
  @Prop() public account!: AccountEntity;
  @Prop({ default: -1 }) public rate!: number;
  @Prop({ default: CurrencyType.USDT }) public currency!: CurrencyType;
  @Prop() public inputAddress!: string;
  @Prop() public inputAmount!: string;
  @Prop() public inputAvailableCoins!: SymbolCoins;
  @Prop() public inputAllCoins!: SymbolCoins;
  @Prop() public inputRequests!: TokenPuzzleDetail[];
  @Prop() public inputSelectedToken!: string;
  @Prop({ default: true }) public addressEditable!: boolean;
  @Prop({ default: true }) public amountEditable!: boolean;
  @Prop() public notificationMessage!: string;
  @Prop() public notificationType!: string;
  @Prop() public notificationIcon!: string;
  @Prop() public notificationClosable!: boolean;
  @Prop({ default: true }) public showClose!: boolean;
  @Prop() public title!: string;

  public submitting = false;
  public validAddress = true;
  public fee = 0;
  public address = "";
  public signAddress = "";
  public contactName = "";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public allcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public INVALID_AMOUNT_MESSAGE = "Invalid amount";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectMax = false;
  public amount = "";
  public selectedToken = xchSymbol();
  public validity = false;
  public offline = false;

  public requests: TokenPuzzleDetail[] = [];
  public contacts: Contact[] = [];

  mounted(): void {
    if (this.inputAddress) this.address = this.inputAddress;
    if (this.inputAmount) this.amount = this.inputAmount;
    if (this.inputSelectedToken) this.selectedToken = this.inputSelectedToken;
    if (this.inputAvailableCoins && this.inputRequests && this.inputAllCoins) {
      this.availcoins = this.inputAvailableCoins;
      this.allcoins = this.inputAllCoins;
      this.requests = this.inputRequests;
    }
    this.loadCoins();
    this.updateContacts();
  }

  get path(): string {
    return this.$route.path;
  }

  @Emit("close")
  close(): void {
    return;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  updateContacts(): void {
    const contactsJson = localStorage.getItem("CONTACTS");
    if (contactsJson == null) {
      return;
    }
    let contacts = JSON.parse(contactsJson);
    for (let c of contacts) {
      this.contacts.push({ name: c.name, address: c.address, network: convertToChainId(c.network) });
    }
  }

  get tokenNames(): string[] {
    return getCatNames(this.account);
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get numericAmount(): bigint {
    const decimal = this.selectedToken == xchSymbol() ? 12 : 3;
    return BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));
  }

  get feeBigInt(): bigint {
    return BigInt(this.fee);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  reset(): void {
    this.validAddress = true;
    this.bundle = null;
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

    if (!this.availcoins || !this.allcoins) {
      try {
        const coins =
          this.account.type == "PublicKey"
            ? await getAvailableCoins(this.account)
            : await getAvailableCoinsWithRequests(this.account, this.requests);
        this.availcoins = coins[0];
        this.allcoins = coins[1];
      } catch (err) {
        this.offline = true;
      }
    }

    if (!this.availcoins || !this.availcoins[this.selectedToken]) {
      return;
    }

    const availcoins = this.availcoins[this.selectedToken].map((_) => _.amount);

    this.maxAmount = bigDecimal.divide(
      availcoins.reduce((a, b) => a + b, 0n),
      Math.pow(10, this.decimal),
      this.decimal
    );

    if (this.allcoins && this.allcoins[this.selectedToken]) {
      const allcoins = this.allcoins[this.selectedToken].map((_) => _.amount);

      this.totalAmount = bigDecimal.divide(
        allcoins.reduce((a, b) => a + b, 0n),
        Math.pow(10, this.decimal),
        this.decimal
      );
    }

    this.maxStatus = "Loaded";
  }

  async sign(): Promise<void> {
    this.submitting = true;
    try {
      if (!this.account.firstAddress) {
        this.submitting = false;
        return;
      }

      const decimal = this.selectedToken == xchSymbol() ? 12 : 3;
      const amount = BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));

      if (this.availcoins == null) {
        this.submitting = false;
        return;
      }
      let tgt_hex: Hex0x = "()";
      let change_hex: Hex0x = "()";
      try {
        tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.signAddress));
        change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      } catch (err) {
        Notification.open({
          message: this.$tc("send.messages.error.INVALID_ADDRESS"),
          type: "is-danger",
          duration: 5000,
        });
        this.validAddress = false;
        this.submitting = false;
        return;
      }
      if (!this.signAddress.startsWith(xchPrefix())) {
        Notification.open({
          message: this.$tc("send.messages.error.ADDRESS_NOT_MATCH_NETWORK"),
          type: "is-danger",
          duration: 5000,
        });
        this.validAddress = false;
        this.submitting = false;
        return;
      }
      // there is error in checking this regular expression
      // eslint-disable-next-line no-useless-escape
      // const memo = this.memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_"); // here's where "." is replaced by _
      const memo = this.memo.replace(/[&/\\#+()$~%'"*?<>{}[\] ]/g, "_");
      const tgts: TransferTarget[] = [{ address: tgt_hex, amount, symbol: this.selectedToken, memos: [tgt_hex, memo] }];
      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee), xchSymbol());
      const observers = this.requests.length ? this.requests : await getAssetsRequestObserver(this.account);
      const ubundle = await transfer.generateSpendBundleIncludingCat(plan, observers, [], networkContext());
      if (this.account.type == "PublicKey") {
        this.bundle = await signSpendBundle(ubundle, [], networkContext());
        await this.offlineSignBundle();
      } else {
        this.bundle = await signSpendBundle(ubundle, this.requests, networkContext());
      }
    } catch (error) {
      Notification.open({
        message: this.$tc("send.ui.messages.failedToSign") + error,
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
    submitBundle(
      this.bundle,
      this.account,
      (_) => (this.submitting = _),
      () => {
        this.close();
        this.$emit("success");
      }
    );
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  openAddressBook(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { parent: "Send" },
      events: {
        selected: (value: string): void => {
          this.reset();
          this.address = value;
        },
      },
    });
  }

  addAddress(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { parent: "Send", defaultMode: "Add", defaultAddress: this.address },
      events: { added: this.updateContacts },
    });
    return;
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

  showSend(): void {
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

<style scoped lang="scss"></style>
