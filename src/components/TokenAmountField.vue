<template>
  <b-field :message="amountMessage || '0 mojos'">
    <template #label>
      {{ $t("send.ui.label.amount") }}
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
        <b-button tag="a" type="is-info is-light" size="is-small" @click="setMax()">
          <span v-if="maxAmount == -1"> {{ $t("send.ui.span.loading") }} {{ selectedToken }}</span>
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

@Component({
  components: {
    KeyBox,
  },
})
export default class TotalAmountField extends Vue {
  @Prop({ default: "0" }) private value!: string;

  @Prop() private tokenNames!: string[];
  @Prop({ default: 0 }) private fee!: number;

  @Prop({ default: true }) private amountEditable!: boolean;
  @Prop({ default: "-1" }) private maxAmount!: string;
  @Prop({ default: "-1" }) private totalAmount!: string;
  @Prop({ default: "XCH" }) private selectedToken!: string;

  public INVALID_AMOUNT_MESSAGE = "Invalid amount";
  public selectMax = false;

  input(val: string): void {
    this.$emit("input", val);
  }

  @Watch("value")
  onValueChange(): void {
    this.$emit("validity", this.amountMessage != this.INVALID_AMOUNT_MESSAGE);
  }

  changeToken(token: string): void {
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

    if (bigDecimal.compareTo(this.amount, this.maxAmount) > 0) return this.INVALID_AMOUNT_MESSAGE;

    const mojo = bigDecimal.multiply(this.amount, Math.pow(10, this.decimal));
    if (Number(mojo) < 1) return this.INVALID_AMOUNT_MESSAGE;
    return bigDecimal.getPrettyValue(mojo, 3, ",") + " mojos";
  }

  get decimal(): number {
    return this.selectedToken == "XCH" ? 12 : 3;
  }

  setMax(): void {
    this.$emit("set-max");
  }
}
</script>

<style scoped lang="scss"></style>
