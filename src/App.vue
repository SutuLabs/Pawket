<template>
  <div id="app" ref="container">
    <div class="is-hidden-tablet has-text-centered pt-2" v-if="!unlocked">
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
    <div class="logo is-hidden-tablet" v-if="!unlocked">
      <img width="200px" src="@/assets/logo.svg" />
    </div>
    <div class="column is-8 is-offset-2 is-hidden-mobile">
      <b-navbar>
        <template #brand>
          <b-navbar-item @click="home()">
            <img src="./assets/logo.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
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
          <div class="py-4" v-if="showNavigation">
            <b-button
              @click="$router.push('/')"
              icon-left="wallet"
              type="is-primary"
              outlined
              :class="{
                'border-less': true,
                'has-background-primary': path == '/',
                'has-text-white': path == '/',
              }"
            >
              {{ $t("app.ui.navigation.wallet") }}
            </b-button>
            <b-button
              @click="$router.push('/trade')"
              icon-left="trending-up"
              type="is-primary"
              outlined
              :class="{
                'border-less': true,
                'has-background-primary': path == '/trade',
                'has-text-white': path == '/trade',
              }"
            >
              {{ $t("app.ui.navigation.trade") }}
            </b-button>
            <b-button
              @click="$router.push('/explore')"
              icon-left="earth"
              type="is-primary"
              outlined
              :class="{
                'border-less': true,
                'has-background-primary': path == '/explore',
                'has-text-white': path == '/explore',
              }"
              v-if="debugMode"
            >
              {{ $t("app.ui.navigation.explore") }}
            </b-button>
            <b-button
              @click="$router.push('/settings')"
              icon-left="cog"
              type="is-primary"
              :class="{
                'border-less': true,
                'has-background-primary': path == '/settings',
                'has-text-white': path == '/settings',
              }"
              outlined
            >
              {{ $t("app.ui.navigation.settings") }}
            </b-button>
          </div>
        </template>
      </b-navbar>
    </div>
    <div v-if="unlocked == false && hasAccount" class="pt-6 mt-6 login">
      <verify-password></verify-password>
    </div>
    <div v-else>
      <router-view />
    </div>
    <nav class="navbar is-link is-fixed-bottom is-hidden-tablet top-border" role="navigation" v-if="showNavigation">
      <div class="navbar-brand">
        <router-link
          :to="'/'"
          :class="{
            'navbar-item': true,
            'is-expanded': true,
            'is-block': true,
            'has-text-centered': true,
            'has-background-white': true,
            'has-text-grey': path != '/',
            'has-text-primary': path == '/',
          }"
        >
          <b-icon icon="wallet"></b-icon>
          <p class="is-size-7">{{ $t("app.ui.navigation.wallet") }}</p>
        </router-link>
        <router-link
          :to="'/trade'"
          :class="{
            'navbar-item': true,
            'is-expanded': true,
            'is-block': true,
            'has-text-centered': true,
            'has-background-white': true,
            'has-text-grey': path != '/trade',
            'has-text-primary': path == '/trade',
          }"
        >
          <b-icon icon="trending-up"></b-icon>
          <p class="is-size-7">{{ $t("app.ui.navigation.trade") }}</p>
        </router-link>
        <router-link
          :to="'/explore'"
          :class="{
            'navbar-item': true,
            'is-expanded': true,
            'is-block': true,
            'has-text-centered': true,
            'has-background-white': true,
            'has-text-grey': path != '/explore',
            'has-text-primary': path == '/explore',
          }"
          v-if="debugMode"
        >
          <b-icon icon="earth"></b-icon>
          <p class="is-size-7">{{ $t("app.ui.navigation.explore") }}</p>
        </router-link>
        <router-link
          :to="'/settings'"
          :active="path == '/settings'"
          :class="{
            'navbar-item': true,
            'is-expanded': true,
            'is-block': true,
            'has-text-centered': true,
            'has-background-white': true,
            'has-text-grey': path != '/settings',
            'has-text-primary': path == '/settings',
          }"
        >
          <b-icon icon="cog"></b-icon>
          <p class="is-size-7">{{ $t("app.ui.navigation.settings") }}</p>
        </router-link>
      </div>
    </nav>
    <div class="my-3 is-hidden-tablet">&nbsp;</div>
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong> {{ $t("footer.ui.productInfo.name") }}</strong>
          <span @click="versionClick()">[{{ version }}]</span><span v-if="debugMode" @click="disableDebug()">[DEBUG]</span> by
          <b-icon icon="github" size="is-small"></b-icon
          ><a href="https://github.com/chiabee" target="_blank" class="has-color-link">{{ $t("footer.ui.productInfo.author") }}</a
          >.
          <br />
          <a href="https://info.pawket.app/" target="_blank" size="is-small" class="has-color-link">
            <b-icon icon="home" size="is-small"></b-icon>
            {{ $t("footer.ui.button.home") }}
            <b-icon icon="open-in-new" size="is-small"></b-icon>
          </a>
          |
          <a href="javascript:void(0)" size="is-small" @click="showDebugHelper()" class="has-color-link">
            <b-icon icon="developer-board" size="is-small"></b-icon>
            {{ $t("footer.ui.button.developer") }}
          </a>
          |
          <a href="javascript:void(0)" size="is-small" @click="showProxy()" class="has-color-link">
            <b-icon icon="router-network" size="is-small"></b-icon>
            {{ $t("footer.ui.button.proxy") }}
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import store from "./store";
import DevHelper from "@/components/DevHelper.vue";
import OfflineQrCode from "./components/OfflineQrCode.vue";
import { NetworkInfo, xchPrefix } from "./store/modules/network";
import VerifyPassword from "./components/VerifyPassword.vue";

@Component({ components: { VerifyPassword } })
export default class App extends Vue {
  public debugClick = 9;

  @Watch("path")
  scrollTop(): void {
    const container = this.$refs.container as Element;
    if (container) container.scrollIntoView();
  }

  get version(): string {
    return process.env.VUE_APP_VERSION || "";
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  get password(): boolean {
    return !!store.state.vault.encryptKey;
  }

  get hasAccount(): boolean {
    return store.state.vault.passwordHash != null;
  }

  get showNavigation(): boolean {
    return !this.$route.path.startsWith("/create") && this.unlocked;
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.state.network.networkId = value;
  }

  get path(): string {
    return this.$route.path;
  }

  mounted(): void {
    store.state.app.debug = localStorage.getItem("DEBUG_MODE") ? localStorage.getItem("DEBUG_MODE") === "true" : false;
  }

  versionClick(): void {
    this.debugClick--;
    if (this.debugClick == 0) {
      store.state.app.debug = true;
      Notification.open({
        message: `Debug mode enabled`,
        type: "is-primary",
      });
      localStorage.setItem("DEBUG_MODE", "true");
    }
  }

  home(): void {
    if (this.$route.path.startsWith("/create") || this.$route.path == "/") return;
    this.$router.push("/");
  }

  async switchNetwork(networkId: string): Promise<void> {
    await store.dispatch("switchNetwork", networkId);
  }

  disableDebug(): void {
    this.debugClick = 9;
    store.state.app.debug = false;
    Notification.open({
      message: `Debug mode disabled`,
      type: "is-primary",
    });
    localStorage.setItem("DEBUG_MODE", "false");
  }

  showDebugHelper(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: {},
    });
  }

  showProxy(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: { mode: "PROXY", prefix: xchPrefix() },
    });
  }
}
</script>
<style lang="scss">
@import "@/styles/colors.scss";
@import "~bulma/sass/utilities/derived-variables";

body,
html {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  width: 100%;
  height: 100%;
}

.top-border {
  border-top: 1px solid #ededed;
}

.border-less {
  border: none;
}

.login {
  height: 60vh !important;
  z-index: 99 !important;
}

a.has-text-primary:hover,
a.has-text-primary:focus {
  color: $primary !important;
}

.logo {
  position: absolute;
  top: 15%;
  left: 20%
}
</style>
