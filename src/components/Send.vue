<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("send.ui.title.send") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-notification
        v-if="notificationMessage"
        :type="notificationType || 'is-success'"
        has-icon
        :icon="notificationIcon || 'heart'"
        :closable="notificationClosable"
      >
        {{ notificationMessage }}
      </b-notification>
      <b-field :label="$t('send.ui.label.address')">
        <b-input v-model="address" @input="reset()" expanded :disabled="!addressEditable"></b-input>
        <p class="control">
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
        <b-input maxlength="100" v-model="memo" type="text" @input="reset()" :disabled="selectedToken == 'XCH'"></b-input>
      </b-field>
      <fee-selector v-model="fee" @input="changeFee()"></fee-selector>
      <b-field v-if="bundle">
        <template #label>
          {{ $t("send.ui.label.bundle") }}
          <key-box icon="checkbox-multiple-blank-outline" :value="JSON.stringify(bundle)" tooltip="Copy"></key-box>
          <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
        </template>
        <b-input type="textarea" disabled :value="bundleJson"></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('send.ui.button.cancel')" @click="close()"></b-button>
        <b-button
          :label="$t('send.ui.button.sign')"
          v-if="!bundle"
          type="is-success"
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
import transfer, { SymbolCoins } from "../services/transfer/transfer";
import TokenAmountField from "@/components/TokenAmountField.vue";
import coinHandler from "../services/transfer/coin";
import { debugBundle, submitBundle } from "@/services/view/bundle";
import FeeSelector from "@/components/FeeSelector.vue";
import OfflineQrCode from "@/components/OfflineQrCode.vue";
import OfflineSendShowBundle from "./OfflineSendShowBundle.vue";
import { CurrencyType } from "@/services/exchange/currencyType";

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
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
  public selectedToken = "XCH";
  public validity = false;
  public offline = false;

  public requests: TokenPuzzleDetail[] = [];

  mounted(): void {
    if (this.inputAddress) this.address = this.inputAddress;
    if (this.inputAmount) this.amount = this.inputAmount;
    this.loadCoins();
  }

  @Emit("close")
  close(): void {
    return;
  }

  get decimal(): number {
    return this.selectedToken == "XCH" ? 12 : 3;
  }

  get tokenNames(): string[] {
    return Object.keys(store.state.account.tokenInfo).concat(this.account.cats.map((_) => _.name));
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  reset(): void {
    this.bundle = null;
  }

  get tokenInfo(): TokenInfo {
    const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
    if (this.account.cats) {
      for (let i = 0; i < this.account.cats.length; i++) {
        const cat = this.account.cats[i];
        tokenInfo[cat.name] = {
          id: cat.id,
          symbol: cat.name,
          decimal: 3,
          unit: cat.name,
        };
      }
    }

    return tokenInfo;
  }

  setMax(excludingFee = false): void {
    this.reset();
    excludingFee = this.selectedToken != "XCH" ? true : excludingFee;
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
    if (this.selectedToken == "XCH") {
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

      const decimal = this.selectedToken == "XCH" ? 12 : 3;
      const amount = BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));

      if (this.availcoins == null) {
        this.submitting = false;
        return;
      }

      const tgt_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.address));
      const change_hex = prefix0x(puzzle.getPuzzleHashFromAddress(this.account.firstAddress));
      const tgts = [{ address: tgt_hex, amount, symbol: this.selectedToken, memo: this.memo }];
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
            XCH: coins,
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
