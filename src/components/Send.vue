<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("send.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
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
        <b-field>
          <template #label>
            {{ $t("send.ui.label.address") }}
            <b-button v-if="isNewAddress" tag="a" type="is-primary is-light" size="is-small" @click="addAddress()">
              <span>
                {{ $t("send.ui.span.newAddress") }}
              </span>
            </b-button>
            <span v-if="contactName" class="tag is-primary is-light">
              {{ contactName }}
            </span>
          </template>
          <b-input
            v-model="address"
            @input="reset()"
            expanded
            :disabled="!addressEditable"
            :custom-class="validAddress ? '' : 'is-danger'"
          ></b-input>
          <p class="control">
            <b-tooltip :label="$t('send.ui.tooltip.addressBook')">
              <b-button @click="openAddressBook()" :disabled="!addressEditable">
                <b-icon icon="account"></b-icon>
              </b-button>
            </b-tooltip>
            <b-tooltip :label="$t('send.ui.tooltip.qr')">
              <b-button @click="scanQrCode()" :disabled="!addressEditable">
                <b-icon icon="scan-helper"></b-icon>
              </b-button>
            </b-tooltip>
          </p>
        </b-field>
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
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" @click="cancel()"></b-button>
        <b-button
          :label="$t('send.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
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
import { AccountEntity, TokenInfo } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import { TokenPuzzleDetail } from "../services/crypto/receive";
import store from "@/store";
import { OriginCoin, SpendBundle } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import bigDecimal from "js-big-decimal";
import ScanQrCode from "@/components/ScanQrCode.vue";
import { prefix0x } from "../services/coin/condition";
import transfer, { SymbolCoins, TransferTarget } from "../services/transfer/transfer";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "../services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";
import OfflineQrCode from "@/components/OfflineQrCode.vue";
import OfflineSendShowBundle from "./OfflineSendShowBundle.vue";
import { CurrencyType } from "@/services/exchange/currencyType";
import BundleSummary from "./BundleSummary.vue";
import SendSummary from "./SendSummary.vue";
import AddressBook, { Contact } from "./AddressBook.vue";
import { xchPrefix, xchSymbol } from "@/store/modules/network";
import { getCatNames, getTokenInfo } from "@/services/coin/cat";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
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

  public submitting = false;
  public validAddress = true;
  public fee = 0;
  public address = "";
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

  get isNewAddress(): boolean {
    if (this.address.length < 32) {
      return false;
    }
    for (let c of this.contacts) {
      if (c.address === this.address) return false;
    }
    return true;
  }

  get contactName(): string {
    for (let c of this.contacts) {
      if (c.address === this.address) return c.name;
    }

    return "";
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

      const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      // there is error in checking this regular expression
      // eslint-disable-next-line no-useless-escape
      const memo = this.memo.replace(/[&/\\#,+()$~%.'":*?<>{}\[\] ]/g, "_");
      const tgts: TransferTarget[] = [{ address: tgt_hex, amount, symbol: this.selectedToken, memos: [tgt_hex, memo] }];
      const plan = transfer.generateSpendPlan(this.availcoins, tgts, change_hex, BigInt(this.fee));
      this.bundle = await transfer.generateSpendBundle(plan, this.requests, []);
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

  openAddressBook(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddressBook,
      hasModalCard: true,
      trapFocus: true,
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
      props: { parent: "Send", defaultMode: "Add", defaultAddress: this.address },
      events: { added: this.updateContacts },
    });
    return;
  }

  changeFee(): void {
    this.reset();
    if (this.selectMax) this.setMax();
  }

  offlineScan(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineQrCode,
      hasModalCard: true,
      trapFocus: true,
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
