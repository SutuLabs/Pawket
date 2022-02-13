<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Debug</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-tabs position="is-centered" class="block">
        <b-tab-item label="Bech32m">
          <hash-panel></hash-panel>
        </b-tab-item>
        <b-tab-item label="CLVM">
          <clvm-panel></clvm-panel>
        </b-tab-item>
        <b-tab-item label="Bundle">
          <bundle-panel :input-bundle-text="inputBundleText"></bundle-panel>
        </b-tab-item>
        <b-tab-item label="Coin">
          <coin-panel></coin-panel>
        </b-tab-item>
      </b-tabs>
    </section>
    <footer class="modal-card-foot">
      <b-button label="Close" @click="close()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import CoinPanel from "@/components/DevHelper/CoinPanel.vue";
import HashPanel from "@/components/DevHelper/HashPanel.vue";
import ClvmPanel from "@/components/DevHelper/ClvmPanel.vue";

@Component({
  components: {
    KeyBox,
    BundlePanel,
    CoinPanel,
    HashPanel,
    ClvmPanel,
  },
})
export default class DevHelper extends Vue {
  @Prop() private inputBundleText!: string;

  @Emit("close")
  close(): void {
    return;
  }

}
</script>

<style scoped lang="scss">
</style>
