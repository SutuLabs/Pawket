<template>
  <div class="nav-box">
    <div class="is-hidden-tablet has-text-centered pt-2" v-if="!unlocked && hasAccount">
      <b-dropdown v-model="networkId" aria-role="list" :mobile-modal="false">
        <template #trigger>
          <b-button
            :class="{
              'has-text-primary': networkId == 'mainnet',
              'has-text-info': networkId == 'testnet10',
              'border-less': true,
            }"
            icon-left="brightness-1"
            icon-right="menu-down"
            ><span class="has-text-dark">{{ networkId }}</span></b-button
          >
        </template>
        <b-dropdown-item v-for="net in networks" :key="net.name" :value="net.name" aria-role="listitem">{{
          net.name
        }}</b-dropdown-item>
      </b-dropdown>
    </div>
    <div class="has-text-centered pt-6 is-hidden-tablet" v-if="!unlocked && hasAccount">
      <img width="200px" src="@/assets/logo.svg" />
    </div>
    <div class="is-hidden-mobile">
      <b-navbar class="border-less">
        <template #brand>
          <b-navbar-item @click="home()">
            <img src="@/assets/logo.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
          </b-navbar-item>
        </template>
        <template #start> </template>
        <template #end>
          <b-navbar-dropdown :label="networkId" v-if="!unlocked">
            <b-navbar-item
              @click="switchNetwork(net.name)"
              v-for="net in networks"
              :key="net.name"
              :active="networkId === net.name"
            >
              {{ net.name }}
            </b-navbar-item>
          </b-navbar-dropdown>
          <desktop-nav></desktop-nav>
        </template>
      </b-navbar>
    </div>
  </div>
</template>
<script lang="ts">
import store from "@/store";
import { NetworkInfo } from "@/store/modules/network";
import { Component, Vue } from "vue-property-decorator";
import DesktopNav from "./DesktopNav.vue";

@Component({ components: { DesktopNav } })
export default class NavBar extends Vue {
  get path(): string {
    return this.$route.path;
  }

  home(): void {
    if (this.$route.path.startsWith("/create") || this.$route.path.startsWith("/home")) return;
    this.$router.push("/home").catch(() => undefined);
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  get hasAccount(): boolean {
    return localStorage.getItem("SETTINGS") != null;
  }

  async switchNetwork(networkId: string): Promise<void> {
    await store.dispatch("switchNetwork", networkId);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.dispatch("switchNetwork", value);
  }
}
</script>
<style scoped lang="scss">
.border-less {
  border: none;
}
.nav-box {
  max-width: 1000px;
  margin: auto;
}
</style>
