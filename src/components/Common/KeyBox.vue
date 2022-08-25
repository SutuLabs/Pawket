<template>
  <b-tooltip v-if="value" :multilined="effectiveMultilined" :delay="delay" :position="position" size="is-small">
    <template v-slot:content>
      <p class="break-all">{{ effectiveTooltip }}</p>
    </template>
    <a @click="copy(value)">
      <div class="control">
        <div class="tags has-addons">
          <span class="tag is-info is-light m-0">
            <span class="mx-1" v-if="effectiveDisplayValue">{{ effectiveDisplayValue }} </span>
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

@Component({
  filters: { shorten },
})
export default class KeyBox extends Vue {
  @Prop() private value!: string;
  @Prop() private display!: string;
  @Prop({ default: false }) private showValue!: boolean;
  @Prop() private icon!: string;
  @Prop() private tooltip!: string;
  @Prop() private multilined!: boolean | undefined;
  @Prop({ default: 0 }) public delay!: number;
  @Prop({ default: "is-top" }) public position!: "is-top" | "is-bottom" | "is-left" | "is-right";

  get effectiveMultilined(): boolean {
    return this.multilined === undefined ? this.effectiveTooltip?.length > 30 : this.multilined;
  }
  get effectiveTooltip(): string {
    return this.tooltip ? this.tooltip : this.value;
  }

  get effectiveDisplayValue(): string {
    return this.showValue ? shorten(this.value) : this.display;
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
