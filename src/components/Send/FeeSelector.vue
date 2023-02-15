<template>
  <div>
    <b-field :label="$t('send.ui.label.fee')">
      <b-numberinput
        controls-alignment="left"
        controls-position="compact"
        max="1000000000"
        min="0"
        v-model="fee"
        :exponential="true"
        @input="changeFee()"
        expanded
        :disabled="feeType !== 'Custom'"
      ></b-numberinput>

      <p class="control">
        <span class="button is-static"><span class="is-size-7">mojos</span></span>
      </p>
      <p class="control is-hidden-mobile">
        <span class="button" style="min-width: 180px">
          <fee-type-slider :feeType.sync="feeType" @changeFeeType="changeFeeType"></fee-type-slider>
        </span>
      </p>
    </b-field>
    <b-field>
      <p class="control is-hidden-tablet">
        <span class="button" style="width: 80vw">
          <fee-type-slider :feeType.sync="feeType" @changeFeeType="changeFeeType"></fee-type-slider>
        </span>
      </p>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import FeeTypeSlider, { FeeType } from "./FeeTypeSlider.vue";

@Component({
  components: {
    FeeTypeSlider,
  },
})
export default class FeeSelector extends Vue {
  @Prop() value!: number;
  public fee = 0;
  public feeType: FeeType = "Custom";
  public fees: { [type in FeeType]: number } = {
    Custom: 0,
    Low: 5,
    Medium: 100,
    High: 1000,
  };

  @Watch("value")
  onValueChange(): void {
    this.fee = this.value;
    this.changeFee();
  }

  changeFeeType(t: FeeType): void {
    this.feeType = t;
    this.changeFee();
  }

  changeFee(): void {
    let newValue = this.fee;
    if (this.feeType !== "Custom") {
      newValue = this.fees[this.feeType];
    }

    if (!newValue) newValue = 1;
    if (newValue != this.value) this.$emit("input", newValue);
  }

  mounted(): void {
    this.fee = this.value ?? 0;
  }
}
</script>

<style scoped lang="scss"></style>
