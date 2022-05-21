<template>
  <div id="app">
    <div class="column is-8 is-offset-2">
      <b-navbar>
        <template #brand>
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img src="./assets/logo.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
          </b-navbar-item>
        </template>
        <template #start> </template>
        <template #end>
          <b-navbar-dropdown :label="networkId">
            <b-navbar-item @click="switchNetwork(net.name)" v-for="net in networks" :key="net.name">
              {{ net.name }}
            </b-navbar-item>
          </b-navbar-dropdown>
          <b-navbar-dropdown :label="$t('app.ui.button.lang')">
            <b-navbar-item @click="changeLang('en')" :active="$i18n.locale === 'en'"> English </b-navbar-item>
            <b-navbar-item @click="changeLang('zhcn')" :active="$i18n.locale === 'zhcn'"> 简体中文 </b-navbar-item>
          </b-navbar-dropdown>
        </template>
      </b-navbar>
    </div>
    <router-view />
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
import { Component, Vue } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import store from "./store";
import DevHelper from "@/components/DevHelper.vue";
import OfflineQrCode from "./components/OfflineQrCode.vue";
import { NetworkInfo } from "./store/modules/network";

@Component
export default class App extends Vue {
  public debugClick = 9;
  get version(): string {
    return process.env.VUE_APP_VERSION || "";
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get networks():  NetworkInfo {
    return store.state.network.networks;
  }

  get networkId():  string {
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
      canCancel: ["x"],
      props: {},
    });
  }

  showProxy(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: { mode: "PROXY" },
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
</style>
