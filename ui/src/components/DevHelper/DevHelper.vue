<template>
  <div class="modal-card">
    <top-bar :title="$t('settings.devhelper.title')" :tag="network" @close="close()" :showClose="showClose"></top-bar>
    <section class="modal-card-body">
      <b-tabs position="is-centered" class="block" v-model="selectedTab">
        <b-tab-item label="Address">
          <hash-panel></hash-panel>
        </b-tab-item>
        <b-tab-item label="Name">
          <name-panel></name-panel>
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
        <b-tab-item label="Coin">
          <coin-panel :puzzle-hash="puzzle_hash"></coin-panel>
        </b-tab-item>
      </b-tabs>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import CoinPanel from "@/components/DevHelper/CoinPanel.vue";
import HashPanel from "@/components/DevHelper/HashPanel.vue";
import NamePanel from "@/components/DevHelper/NamePanel.vue";
import ClvmPanel from "@/components/DevHelper/ClvmPanel.vue";
import OfferPanel from "@/components/DevHelper/OfferPanel.vue";
import store from "@/store";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    KeyBox,
    BundlePanel,
    CoinPanel,
    HashPanel,
    NamePanel,
    ClvmPanel,
    OfferPanel,
    TopBar,
  },
})
export default class DevHelper extends Vue {
  @Prop() public inputBundleText!: string;
  @Prop() public inputOfferText!: string;
  @Prop({ default: true }) public showClose!: boolean;
  public selectedTab = 0;
  public puzzle_hash = "";

  get networkId(): string {
    return store.state.network.networkId;
  }

  mounted(): void {
    if (this.inputBundleText) {
      this.selectedTab = 3;
    }
    if (this.inputOfferText) {
      this.selectedTab = 4;
    }
  }

  get path(): string {
    return this.$route.path;
  }

  close(): void {
    this.$emit("close");
    if (this.path.endsWith("devhelper")) this.$router.back();
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get network(): string {
    return this.networkId;
  }
}
</script>

<style scoped lang="scss"></style>
