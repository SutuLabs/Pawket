<template>
  <b-field>
    <template #label>
      {{ $t("bundleText.ui.title") }}
      <key-box icon="checkbox-multiple-blank-outline" :value="bundleText" :tooltip="$t('bundleText.ui.copy')"></key-box>
      <b-button tag="a" class="mr-2" icon-left="qrcode" size="is-small" @click="showQrCode()"> </b-button>
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
import KeyBox from "@/components/Common/KeyBox.vue";
import store from "@/store";
import OfflineSendShowBundle from "@/components/Offline/OfflineSendShowBundle.vue";
import { SpendBundle } from "@/services/spendbundle";

@Component({
  components: {
    KeyBox,
  },
})
export default class BundleText extends Vue {
  @Prop() public value!: string;
  @Prop() public bundleObject!: SpendBundle;

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

  showQrCode(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineSendShowBundle,
      hasModalCard: true,
      trapFocus: false,
      props: { bundle: this.bundleObject },
    });
  }
}
</script>

<style scoped lang="scss"></style>
