<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Receive</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body has-text-centered">
      <qrcode-vue :value="account.firstAddress" size="300"></qrcode-vue>
      <key-box :value="account.firstAddress"></key-box>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import { Account } from "@/store/index";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
  },
})
export default class Receive extends Vue {
  @Prop() private account!: Account;

  @Emit("close")
  close(): void {
    return;
  }
}
</script>

<style scoped lang="scss"></style>
