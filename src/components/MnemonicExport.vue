<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">
        {{ $t("mnemonicExport.ui.title.mnemonic") }}
      </p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      {{ mnemonic }}
      <br />
      <key-box icon="checkbox-multiple-blank-outline" :tooltip="$t('mnemonicExport.ui.tooltip.copy')" :value="mnemonic"></key-box>
      <div class="has-text-centered">
        <qrcode-vue v-if="debugMode" :value="mnemonic" size="300"></qrcode-vue>
      </div>
    </section>
    <footer class="modal-card-foot">
      <b-button :label="$t('mnemonicExport.ui.button.close')" @click="close()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import store from "@/store";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class MnemonicExport extends Vue {
  @Prop() private mnemonic!: string;

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }
}
</script>

<style scoped lang="scss"></style>
