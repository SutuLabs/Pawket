<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Mnemonic</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      {{ mnemonic }}
      <br />
      <key-box display="✂️" tooltip="Copy" :value="mnemonic"></key-box>
      <div class="has-text-centered">
        <qrcode-vue :value="mnemonic" size="300"></qrcode-vue>
      </div>
    </section>
    <footer class="modal-card-foot">
      <b-button label="Close" @click="close()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class MnemonicExport extends Vue {
  @Prop() private mnemonic!: string;

  @Emit("close")
  close(): void {
    return;
  }
}
</script>

<style scoped lang="scss"></style>
