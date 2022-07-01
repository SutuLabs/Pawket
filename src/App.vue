<template>
  <div id="app">
    <div class="column is-8 is-offset-2 is-hidden-mobile">
      <b-navbar>
        <template #brand>
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="./assets/logo.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
          </b-navbar-item>
        </template>
        <template #start> </template>
        <template #end>
          <div class="py-4" v-if="showNavigation">
            <b-button
              @click="$router.push('/')"
              size="is-medium"
              icon-left="wallet"
              type="is-primary"
              class="boder-less"
              outlined
            >
              {{ $t("app.ui.navigation.wallet") }}
            </b-button>
            <b-button
              @click="$router.push('/trade')"
              size="is-medium"
              icon-left="trending-up"
              type="is-primary"
              class="boder-less"
              outlined
            >
              {{ $t("app.ui.navigation.trade") }}
            </b-button>
            <b-button
              @click="$router.push('/explore')"
              size="is-medium"
              icon-left="earth"
              type="is-primary"
              class="boder-less"
              outlined
              v-if="debugMode"
            >
              {{ $t("app.ui.navigation.explore") }}
            </b-button>
            <b-button
              @click="$router.push('/settings')"
              size="is-medium"
              icon-left="cog"
              type="is-primary"
              class="boder-less"
              outlined
            >
              {{ $t("app.ui.navigation.settings") }}
            </b-button>
          </div>
        </template>
      </b-navbar>
    </div>
    <router-view />
    <nav class="navbar is-link is-fixed-bottom is-hidden-tablet top-border" role="navigation" v-if="showNavigation">
      <div class="navbar-brand">
        <router-link :to="'/'" class="navbar-item is-expanded is-block has-text-centered has-background-white">
          <b-icon icon="wallet" type="is-primary"></b-icon>
          <p class="is-size-7 has-text-primary">{{ $t("app.ui.navigation.wallet") }}</p>
        </router-link>
        <router-link :to="'/trade'" class="navbar-item is-expanded is-block has-text-centered has-background-white">
          <b-icon icon="trending-up" type="is-primary"></b-icon>
          <p class="is-size-7 has-text-primary">{{ $t("app.ui.navigation.trade") }}</p>
        </router-link>
        <router-link
          :to="'/explore'"
          class="navbar-item is-expanded is-block has-text-centered has-background-white"
          v-if="debugMode"
        >
          <b-icon icon="earth" type="is-primary"></b-icon>
          <p class="is-size-7 has-text-primary">{{ $t("app.ui.navigation.explore") }}</p>
        </router-link>
        <router-link :to="'/settings'" class="navbar-item is-expanded is-block has-text-centered has-background-white">
          <b-icon icon="cog" type="is-primary"></b-icon>
          <p class="is-size-7 has-text-primary">{{ $t("app.ui.navigation.settings") }}</p>
        </router-link>
      </div>
    </nav>
    <div class="my-3 is-hidden-tablet">&nbsp;</div>
    <footer class="footer is-hidden-mobile">
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
import { Component, Vue } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import store from "./store";
import DevHelper from "@/components/DevHelper.vue";
import OfflineQrCode from "./components/OfflineQrCode.vue";
import { NetworkInfo, xchPrefix } from "./store/modules/network";
import { tc } from "./i18n/i18n";

@Component
export default class App extends Vue {
  public debugClick = 9;
  get version(): string {
    return process.env.VUE_APP_VERSION || "";
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
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

  changeLang(lang: string): void {
    this.$i18n.locale = lang;
    localStorage.setItem("Locale", lang);
  }

  async switchNetwork(networkId: string): Promise<void> {
    await store.dispatch("switchNetwork", networkId);
    this.$buefy.dialog.confirm({
      message: tc("app.switchNetwork.message"),
      confirmText: tc("app.switchNetwork.confirm"),
      cancelText: tc("app.switchNetwork.cancel"),
      type: "is-primary",
      hasIcon: true,
      onConfirm: () => store.dispatch("lock"),
    });
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

.boder-less {
  border: none;
}
</style>
