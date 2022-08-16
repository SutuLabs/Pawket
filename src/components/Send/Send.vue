<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('send.ui.title.send')" @close="$emit('close')" :showClose="showClose"></top-bar>
    <section class="modal-card-body">
      <div v-show="!bundle">
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
          @offline-scan="offlineScan()"
        >
        </token-amount-field>
        <b-field :label="$t('send.ui.label.memo')">
          <b-input maxlength="100" v-model="memo" type="text" @input="reset()" :disabled="selectedToken == xchSymbol"></b-input>
        </b-field>
        <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      </div>
      <template v-if="bundle">
        <b-notification type="is-info is-light" has-icon icon="head-question-outline" :closable="false">
          <span v-html="$sanitize($t('send.ui.summary.notification'))"></span>
        </b-notification>
        <send-summary
          :amount="numericAmount"
          :unit="selectedToken"
          :fee="feeBigInt"
          :address="address"
          :contactName="contactName"
        ></send-summary>
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="is-block buttons modal-card-foot pb-2 my-0">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" class="is-pulled-left" @click="cancel()"></b-button>
        <b-button
          :label="$t('send.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
          class="is-pulled-right"
          @click="sign()"
          :disabled="!validity || submitting"
        ></b-button>
      </div>
      <div>
        <b-button
          :label="$t('send.ui.button.submit')"
          v-if="bundle && !offline"
          type="is-primary"
          class="is-pulled-right"
          @click="submit()"
          :disabled="submitting"
        ></b-button>
        <b-button
          :label="$t('send.ui.button.showSend')"
          v-if="bundle && offline"
          type="is-primary"
          class="is-pulled-right"
          @click="showSend()"
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
import { TokenPuzzleDetail } from "@/services/crypto/receive";
import store from "@/store";
import { OriginCoin, SpendBundle } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import bigDecimal from "js-big-decimal";
import { prefix0x } from "@/services/coin/condition";
import transfer, { SymbolCoins, TransferTarget } from "@/services/transfer/transfer";
import TokenAmountField from "@/components/Send/TokenAmountField.vue";
import coinHandler from "@/services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/Send/FeeSelector.vue";
import OfflineSendShowBundle from "@/components/Offline/OfflineSendShowBundle.vue";
import { CurrencyType } from "@/services/exchange/currencyType";
import BundleSummary from "@/components/Bundle/BundleSummary.vue";
import SendSummary from "@/components/Send/SendSummary.vue";
import { chainId, xchPrefix, xchSymbol } from "@/store/modules/network";
import { getCatNames, getTokenInfo } from "@/services/coin/cat";
import AddressField from "@/components/Common/AddressField.vue";
import TopBar from "@/components/Common/TopBar.vue";
import AddressBook, { Contact } from "@/components/AddressBook/AddressBook.vue";
import { getLineageProofPuzzle } from "@/services/transfer/call";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
    AddressField,
    TopBar,
  },
})
export default class Send extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop({ default: -1 }) private rate!: number;
  @Prop({ default: CurrencyType.USDT }) private currency!: CurrencyType;
  @Prop() private inputAddress!: string;
  @Prop() private inputAmount!: string;
  @Prop({ default: true }) private addressEditable!: boolean;
  @Prop({ default: true }) private amountEditable!: boolean;
  @Prop() private notificationMessage!: string;
  @Prop() private notificationType!: string;
  @Prop() private notificationIcon!: string;
  @Prop() private notificationClosable!: boolean;
  @Prop({ default: true }) public showClose!: boolean;

  public submitting = false;
  public validAddress = true;
  public fee = 0;
  public address = "";
  public contactName = "";
  public memo = "";
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
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
    this.loadCoins();
    this.updateContacts();
  }

  @Emit("close")
  close(): void {
    return;
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get network(): string {
    return store.state.network.networkId;
  }

  updateContacts(): void {
    const contactsJson = localStorage.getItem("CONTACTS");
    if (contactsJson == null) {
      return;
    }
    let contacts = JSON.parse(contactsJson);
    for (let c of contacts) {
      this.contacts.push({ name: c.name, address: c.address, network: c.network ? c.network : "mainnet" });
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
      this.requests = await coinHandler.getAssetsRequestDetail(this.account);
    }

    if (!this.availcoins) {
      try {
        this.availcoins = await coinHandler.getAvailableCoins(this.requests, coinHandler.getTokenNames(this.account));
      } catch (err) {
        this.offline = true;
      }
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
      let tgt_hex = "";
      let change_hex = "";
      try {
        tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
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
      if (!this.address.startsWith(xchPrefix())) {
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
      const memo = this.memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_");
      const tgts: TransferTarget[] = [{ address: tgt_hex, amount, symbol: this.selectedToken, memos: [tgt_hex, memo] }];
      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee), xchSymbol());
      this.bundle = await transfer.generateSpendBundleIncludingCat(
        plan,
        this.requests,
        [],
        xchSymbol(),
        chainId(),
        getLineageProofPuzzle
      );
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
    submitBundle(this.bundle, (_) => (this.submitting = _), this.close);
  }

  debugBundle(): void {
    if (!this.bundle) return;
    debugBundle(this, this.bundle);
  }

  async scanQrCode(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Common/ScanQrCode.vue")).default,
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

  async offlineScan(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Offline/OfflineQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { puzzles: this.requests.find((_) => _.symbol == this.selectedToken)?.puzzles },
      events: {
        scanned: (coins: OriginCoin[]): void => {
          this.availcoins = {
            [xchSymbol()]: coins,
          };
          this.loadCoins();
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

<style scoped lang="scss">
.field ::v-deep textarea {
  font-size: 0.6em;
}
</style>