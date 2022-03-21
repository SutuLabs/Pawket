<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Debug</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-tabs position="is-centered" class="block" v-model="selectedTab">
        <b-tab-item label="Bech32m">
          <hash-panel></hash-panel>
        </b-tab-item>
        <b-tab-item label="CLVM">
          <clvm-panel></clvm-panel>
        </b-tab-item>
        <b-tab-item label="Bundle">
          <bundle-panel :input-bundle-text="inputBundleText"></bundle-panel>
        </b-tab-item>
        <b-tab-item label="Offer">
          <offer-panel :input-offer-text="inputOfferText"></offer-panel>
        </b-tab-item>
        <b-tab-item v-if="debugMode" label="Coin">
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
import OfferPanel from "@/components/DevHelper/OfferPanel.vue";
import store from '@/store';

@Component({
  components: {
    KeyBox,
    BundlePanel,
    CoinPanel,
    HashPanel,
    ClvmPanel,
    OfferPanel,
  },
})
export default class DevHelper extends Vue {
  @Prop() private inputBundleText!: string;
  @Prop() private inputOfferText!: string;
  public selectedTab = 0;

  mounted(): void {
    if (this.inputBundleText) {
      this.selectedTab = 2;
    }
    if (this.inputOfferText) {
      this.selectedTab = 3;
    }
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }

}
</script>

<style scoped lang="scss">
</style>
