<template>
  <b-tooltip v-if="value" :multilined="effectiveMultilined" :delay="delay" :position="position" :size="tooltipSize">
    <template v-slot:content>
      <p class="break-all">{{ effectiveTooltip }}</p>
    </template>
    <a @click="copy(value)">
      <div class="control">
        <!--<div class="tags has-addons">-->
        <div class="has-addons">
          <!--<span class="tag is-info is-light m-0">-->
          <span class="is-info is-light m-0 is-size-7">
            <span class="mx-1" v-if="effectiveDisplayValue && !breakDisplay">{{ effectiveDisplayValue }}</span>
            <span class="mx-1" v-if="effectiveDisplayValue && breakDisplay">{{ effectiveDisplayValue.substr(0, Math.ceil(effectiveDisplayValue.length/2) + 2)}}</span>
            <br v-if="effectiveDisplayValue && breakDisplay">
            <span class="mx-1" v-if="effectiveDisplayValue && breakDisplay">{{ effectiveDisplayValue.substr(Math.floor(effectiveDisplayValue.length/2) + 2)}}</span>
            <b-icon v-if="icon" :icon="icon" size="is-small"> </b-icon>
          </span>
        </div>
      </div>
    </a>
  </b-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store";
import { shorten } from "@/filters/addressConversion";

@Component({})
export default class KeyBox extends Vue {
  @Prop() public value!: string;
  @Prop() public display!: string;
  @Prop({ default: false }) public showValue!: boolean;
  @Prop() public icon!: string;
  @Prop() public tooltip!: string;
  @Prop() public multilined!: boolean | undefined;
  @Prop({ default: 0 }) public delay!: number;
  @Prop({ default: 7 }) public headLength!: number;
  @Prop({ default: 4 }) public tailLength!: number;
  @Prop({ default: "is-top" }) public position!: "is-top" | "is-bottom" | "is-left" | "is-right";
  @Prop({ default: "is-medium" }) public tooltipSize!: "is-small" | "is-medium" | "is-large";

  get effectiveMultilined(): boolean {
    return this.multilined === undefined ? this.effectiveTooltip?.length > 30 : this.multilined;
  }

  get effectiveTooltip(): string {
    return this.tooltip ? this.tooltip : this.value;
  }

  get breakDisplay(): boolean {
    return this.effectiveDisplayValue.length > 30;
  }

  get effectiveDisplayValue(): string {
    return this.showValue ? this.value : this.display;
    //return this.showValue ? shorten(this.value, "...", 0, this.headLength, this.tailLength) : this.display;
  }

  copy(text: string): void {
    store.dispatch("copy", text);
  }
}
</script>

<style scoped lang="scss">
.break-all {
  word-break: break-all;
}
</style>
