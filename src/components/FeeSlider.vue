<template>
  <b-slider :min="0" :max="3" v-model="feeType" :tooltip="false" @input="$emit('changeFeeType', feeType)">
    <b-slider-tick :value="0">{{ $t("send.ui.slider.custom") }}</b-slider-tick>
    <b-slider-tick :value="1">{{ $t("send.ui.slider.low") }}</b-slider-tick>
    <b-slider-tick :value="2">{{ $t("send.ui.slider.medium") }}</b-slider-tick>
    <b-slider-tick :value="3">{{ $t("send.ui.slider.high") }}</b-slider-tick>
  </b-slider>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class KeyBox extends Vue {
  @Prop() feeType!: number;
}
</script>

<style scoped lang="scss"></style>
