<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("mintCat.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <div v-show="!bundle">
        <b-field :label="$t('mintCat.ui.label.address')">
          <b-input v-model="address" @input="reset()" expanded :disabled="!addressEditable"></b-input>
          <p class="control">
            <b-tooltip :label="$t('mintCat.ui.tooltip.qr')">
              <b-button @click="scanQrCode()" :disabled="!addressEditable">
                <b-icon icon="scan-helper"></b-icon>
              </b-button>
            </b-tooltip>
          </p>
        </b-field>
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
        ></send-summary>
        <bundle-summary :account="account" :bundle="bundle"></bundle-summary>
      </template>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <div>
        <b-button :label="$t('mintCat.ui.button.cancel')" @click="cancel()"></b-button>
        <b-button
          :label="$t('mintCat.ui.button.sign')"
          v-if="!bundle"
          type="is-primary"
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
import { AccountEntity, CustomCat, TokenInfo } from "@/store/modules/account";
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

@Component({
  components: {
    KeyBox,
    FeeSelector,
    TokenAmountField,
    BundleSummary,
    SendSummary,
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
  public bundle: SpendBundle | null = null;
  public availcoins: SymbolCoins | null = null;
  public maxAmount = "-1";
  public totalAmount = "-1";
  public maxStatus: "Loading" | "Loaded" = "Loading";
  public selectMax = false;
  public amount = "";
  public symbol = "NEWTOKEN";
  public selectedToken = "XCH";
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
    return this.selectedToken == "XCH" ? 12 : 3;
  }

  get tokenNames(): string[] {
    return ["XCH"];
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

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  reset(): void {
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
    if (this.selectedToken == "XCH") {
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
    if (this.selectedToken == "XCH") {
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

      const decimal = this.selectedToken == "XCH" ? 12 : 3;
      const amount = BigInt(bigDecimal.multiply(this.amount, Math.pow(10, decimal)));

      if (this.availcoins == null) {
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
        this.requests
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
    submitBundle(this.bundle, (_) => (this.submitting = _), this.close);

    this.account.cats.push({ name: this.symbol.toUpperCase(), id: this.assetId });
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
