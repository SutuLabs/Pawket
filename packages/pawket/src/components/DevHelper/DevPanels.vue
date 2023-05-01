<template>
  <div>
    <div class="tabs">
      <ul>
        <router-link
          :to="{ name }"
          v-for="name in ['Address', 'Name', 'CLVM', 'Bundle', 'Offer', 'Coin']"
          :key="name"
          :label="name"
          v-slot="{ navigate, isActive, href }"
          custom
        >
          <li :class="isActive ? 'is-active' : ''">
            <a @click="navigate" :href="href">{{ name }}</a>
          </li>
        </router-link>
      </ul>
    </div>

    <router-view></router-view>
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

@Component({
  components: {
    KeyBox,
    BundlePanel,
    CoinPanel,
    HashPanel,
    NamePanel,
    ClvmPanel,
    OfferPanel,
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
      this.selectedTab = 2;
    }
    if (this.inputOfferText) {
      this.selectedTab = 3;
    }
  }

  get network(): string {
    return this.networkId;
  }

  search(hash: string): void {
    this.selectedTab = 4;
    this.puzzle_hash = hash;
  }
}
</script>

<style scoped lang="scss"></style>
