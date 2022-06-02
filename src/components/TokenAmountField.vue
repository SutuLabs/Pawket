<template>
  <b-field>
    <template #message>
      {{ amountMessage || "0 mojos" }}
      {{ usdtValue }}
      <span v-if="offline && selectedToken != xchSymbol" class="is-pulled-right has-text-danger">
        {{ $t("send.ui.text.offlineOnlySupportXch") }}
      </span>
    </template>
    <template #label>
      {{ label }}
      <span class="is-size-6">
        <b-tooltip
          v-if="totalAmount >= 0"
          position="is-right"
          type="is-light"
          multilined
          :label="$t('send.ui.tooltip.singleCoinExplanation')"
        >
          <b-icon icon="comment-question" size="is-small" type="is-info" class="px-4"></b-icon>
        </b-tooltip>
        <b-button v-if="showMaxAmount && maxAmount >= -1" tag="a" type="is-info is-light" size="is-small" @click="setMax()">
          <span v-if="maxAmount == -1"> {{ $t("send.ui.span.loading") }}</span>
          <span v-else>
            <span v-if="totalAmount >= 0">
              {{ $t("send.ui.span.maxLeadingText") }} {{ maxAmount }} / {{ totalAmount }} {{ selectedToken }}
            </span>
            <span v-else> {{ $t("send.ui.span.maxLeadingText") }} {{ maxAmount }} {{ selectedToken }} </span>
          </span>
        </b-button>
      </span>
      <span v-if="offline" class="is-size-6">
        <b-tooltip position="is-right" type="is-light" multilined :label="$t('send.ui.tooltip.offlineScan')">
          <b-button tag="a" type="is-primary is-light" size="is-small" @click="offlineScan()">
            <b-icon icon="qrcode-scan" size="is-small" class="px-4"></b-icon>
          </b-button>
        </b-tooltip>
      </span>
    </template>
    <b-select :value="selectedToken" @input="changeToken">
      <option v-for="token in tokenNames" :key="token" :value="token">
        {{ token }}
      </option>
    </b-select>
    <b-input :value="amount" expanded :disabled="!amountEditable" @input="input"></b-input>
    <p class="control">
      <span class="button is-static">{{ selectedToken }}</span>
    </p>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import bigDecimal from "js-big-decimal";
import { tc } from "@/i18n/i18n";
import { xchToCurrency } from "@/filters/usdtConversion";
import { CurrencyType } from "@/services/exchange/currencyType";
import { xchSymbol } from "@/store/modules/network";

@Component({
  components: {
    KeyBox,
  },
})
export default class TotalAmountField extends Vue {
  @Prop({ default: "0" }) private value!: string;
  @Prop({ default: -1 }) private rate!: number;
  @Prop({ default: CurrencyType.USDT }) private currency!: CurrencyType;
  @Prop() private tokenNames!: string[];
  @Prop({ default: 0 }) private fee!: number;

  @Prop({ default: true }) private amountEditable!: boolean;
  @Prop({ default: true }) private showMaxAmount!: boolean;
  @Prop({ default: "-1" }) private maxAmount!: string;
  @Prop({ default: "-1" }) private totalAmount!: string;
  @Prop({ default: xchSymbol() }) private selectedToken!: string;
  @Prop({ default: tc("send.ui.label.amount") }) private label!: string;
  @Prop({ default: false }) private offline!: boolean;

  public INVALID_AMOUNT_MESSAGE = tc("send.ui.messages.invalidAmount");
  public INSUFFICIENT_FUNDS = tc("send.ui.messages.insufficientFunds");
  public selectMax = false;

  input(val: string): void {
    this.$emit("input", val);
  }

  @Watch("value")
  onValueChange(): void {
    this.$emit("validity", this.amountMessage != this.INVALID_AMOUNT_MESSAGE);
  }

  changeToken(token: string): void {
    this.$emit("input", "0");
    this.$emit("change-token", token);
  }

  set amount(value: string) {
    this.value = value;
  }

  get amount(): string {
    return this.value;
  }

  get amountMessage(): string {
    if (!this.amount) return "";
    try {
      new bigDecimal(this.amount);
    } catch {
      return "";
    }
    if (Number(this.amount) == 0) return "";

    if (Number(this.maxAmount) > -1 && bigDecimal.compareTo(this.amount, this.maxAmount) > 0) return this.INSUFFICIENT_FUNDS;

    const mojo = bigDecimal.multiply(this.amount, Math.pow(10, this.decimal));
    if (Number(mojo) < 1 || Number(mojo) % 1) return this.INVALID_AMOUNT_MESSAGE;
    return bigDecimal.getPrettyValue(mojo, 3, ",") + " mojos";
  }

  get usdtValue(): string {
    if (this.selectedToken !== xchSymbol()) return "";
    if (this.amountMessage === this.INVALID_AMOUNT_MESSAGE || this.amountMessage === this.INSUFFICIENT_FUNDS) return "";
    if (this.amountMessage === "") return "";
    if (this.rate == -1) return "";
    const mojo = bigDecimal.multiply(this.amount, Math.pow(10, this.decimal));
    return "≈ " + xchToCurrency(Number(mojo), this.rate, this.currency);
  }

  get decimal(): number {
    return this.selectedToken == xchSymbol() ? 12 : 3;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  setMax(): void {
    this.$emit("set-max");
  }

  offlineScan(): void {
    this.$emit("offline-scan");
  }
}
</script>

<style scoped lang="scss"></style>
