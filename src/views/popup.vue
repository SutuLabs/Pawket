<template>
  <div id="app">
    <b-navbar>
      <template #brand>
        <b-navbar-item tag="router-link" :to="{ path: '/' }">
          <img src="@/assets/logo.svg" :alt="$t('verifyPassword.ui.alt.logoAlt')" />
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
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { NotificationProgrammatic as Notification } from "buefy";
import store from "@/store";
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import UniStorage from '@/services/storage';

@Component
export default class App extends Vue {
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
        type: "is-primary",
      });
    }
  }

  async changeLang(lang: string):Promise< void> {
    this.$i18n.locale = lang;
    await UniStorage.create().setItem("Locale", lang);
  }

  disableDebug(): void {
    this.debugClick = 9;
    store.state.app.debug = false;
    Notification.open({
      message: `Debug mode disabled`,
      type: "is-primary",
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
  min-width: 400px;
  min-height: 600px;
}

#app {
  width: 100%;
  height: 100%;
}
</style>
