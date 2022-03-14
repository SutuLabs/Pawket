<template>
  <b-slider :min="0" :max="3" v-model="feeTypeNumber" :tooltip="false" @input="changeFeeType()">
    <b-slider-tick :value="0">{{ $t("send.ui.slider.custom") }}</b-slider-tick>
    <b-slider-tick :value="1">{{ $t("send.ui.slider.low") }}</b-slider-tick>
    <b-slider-tick :value="2">{{ $t("send.ui.slider.medium") }}</b-slider-tick>
    <b-slider-tick :value="3">{{ $t("send.ui.slider.high") }}</b-slider-tick>
  </b-slider>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

export type FeeType = "Custom" | "Low" | "Medium" | "High";

@Component
export default class FeeTypeSlider extends Vue {
  @Prop() feeType!: FeeType;
  feeTypeNumber = 0;
  typeMap: { [key: number]: FeeType } = {
    0: "Custom",
    1: "Low",
    2: "Medium",
    3: "High",
  };
  numberMap: { [key: string]: number } = {
    Custom: 0,
    Low: 1,
    Medium: 2,
    High: 3,
  };

  changeFeeType(): void {
    this.$emit("changeFeeType", this.typeMap[this.feeTypeNumber]);
  }

  mounted(): void {
    if (this.feeType == undefined) {
      this.feeTypeNumber = 0;
      return;
    }
    this.feeTypeNumber = this.numberMap[this.feeType];
  }
}
</script>

<style scoped lang="scss"></style>
