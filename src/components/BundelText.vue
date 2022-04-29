<template>
  <b-field>
    <template #label>
      {{ $t("bundleText.ui.title") }}
      <key-box icon="checkbox-multiple-blank-outline" :value="bundleText" :tooltip="$t('bundleText.ui.copy')"></key-box>
      <b-button tag="a" icon-left="eye" size="is-small" v-if="!showBundleText" @click="showBundleText = true">
        {{ $t("bundleText.ui.button.show") }}
      </b-button>
      <b-button tag="a" icon-left="eye-off" size="is-small" v-if="showBundleText" @click="showBundleText = false">
        {{ $t("bundleText.ui.button.hide") }}
      </b-button>
      <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
    </template>
    <b-input v-if="showBundleText" type="textarea" :value="bundleText"></b-input>
  </b-field>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import store from "@/store";

@Component({
  components: {
    KeyBox,
  },
})
export default class BundleText extends Vue {
  @Prop() private value!: string;
  public showBundleText = false;

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get bundleText(): string {
    return this.value;
  }

  debugBundle(): void {
    this.$emit("debugBundle");
  }
}
</script>

<style scoped lang="scss"></style>
