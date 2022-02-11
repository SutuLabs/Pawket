<template>
  <div id="app">
    <b-navbar>
      <template #brand>
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <img src="./assets/logo.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
        </b-navbar-item>
      </template>
      <template #start> </template>
      <template #end>
        <b-navbar-dropdown :label="$t('app.ui.button.lang')">
          <b-navbar-item @click="changeLang('en')" :active="$i18n.locale === 'en'"> English </b-navbar-item>
          <b-navbar-item @click="changeLang('zhcn')" :active="$i18n.locale === 'zhcn'"> 简体中文 </b-navbar-item>
        </b-navbar-dropdown>
      </template>
    </b-navbar>
    <router-view />
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong>Chiabee Wallet</strong>
          [{{ version }}] by <a href="https://www.chiabee.net">Chiabee</a>. <br />The
          <a href="http://github.com/chiabee">source code</a> would available later. This app is in
          <span @click="alphaClick()">ALPHA</span> stage, don't use in PRODUCTION.
          <span v-if="debugMode" @click="disableDebug()">[DEBUG]</span>
          <span v-if="debugMode" @click="showDebugHelper()">[Helper]</span>
          <br />
          <a target="_blank" href="https://github.com/Chiabee/wallet-doc/">Quick Guide</a>
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

@Component
export default class ProfileCorner extends Vue {
  public debugClick = 9;
  get version(): string {
    return process.env.VUE_APP_VERSION || "";
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  alphaClick(): void {
    this.debugClick--;
    if (this.debugClick == 0) {
      store.state.app.debug = true;
      Notification.open({
        message: `Debug mode enabled`,
        type: "is-success",
      });
    }
  }

  changeLang(lang: string): void {
    this.$i18n.locale = lang;
  }

  disableDebug(): void {
    this.debugClick = 9;
    store.state.app.debug = false;
    Notification.open({
      message: `Debug mode disabled`,
      type: "is-success",
    });
  }

  showDebugHelper(): void {
    this.$buefy.modal.open({
      parent: this,
      component: DevHelper,
      hasModalCard: true,
      trapFocus: true,
      props: {},
    });
  }
}
</script>

<style lang="scss">
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
