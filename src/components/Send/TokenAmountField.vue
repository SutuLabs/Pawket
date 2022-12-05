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
    </template>
    <b-select :value="selectedToken" @input="changeToken">
      <option v-for="token in tokenNames" :key="token" :value="token">
        {{ token }}
      </option>
    </b-select>
    <b-input
      :value="amount"
      expanded
      :disabled="!amountEditable"
      @input="input"
      onkeypress="return event.charCode != 32"
    ></b-input>
    <p class="control">
      <span class="button is-static">{{ selectedToken }}</span>
    </p>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
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
export default class TokenAmountField extends Vue {
  @Prop({ default: "0" }) public value!: string;
  @Prop({ default: -1 }) public rate!: number;
  @Prop({ default: CurrencyType.USDT }) public currency!: CurrencyType;
  @Prop() public tokenNames!: string[];
  @Prop({ default: 0 }) public fee!: number;

  @Prop({ default: true }) public amountEditable!: boolean;
  @Prop({ default: true }) public showMaxAmount!: boolean;
  @Prop({ default: "-1" }) public maxAmount!: string;
  @Prop({ default: "-1" }) public totalAmount!: string;
  @Prop({ default: xchSymbol() }) public selectedToken!: string;
  @Prop({ default: tc("send.ui.label.amount") }) public label!: string;
  @Prop({ default: false }) public offline!: boolean;

  public INVALID_AMOUNT_MESSAGE = tc("send.ui.messages.invalidAmount");
  public INSUFFICIENT_FUNDS = tc("send.ui.messages.insufficientFunds");
  public selectMax = false;

  input(val: string): void {
    this.$emit("input", val.replace(/\s/g, ""));
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
    this.value = value.replace(/\s/g, "");
  }

  get amount(): string {
    return this.value.replace(/\s/g, "");
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
}
</script>

<style scoped lang="scss"></style>
