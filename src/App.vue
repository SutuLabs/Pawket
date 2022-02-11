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
        <b-navbar-item tag="div">
          <b-dropdown class="is-pulled-right" :triggers="['hover', 'click']" aria-role="list" v-model="$i18n.locale">
            <template #trigger>
              <b-button :label="$t('app.ui.button.lang')" icon-right="menu-down" />
            </template>
            <b-dropdown-item aria-role="listitem" value="zhcn">简体中文</b-dropdown-item>
            <b-dropdown-item aria-role="listitem" value="en">English</b-dropdown-item>
          </b-dropdown>
        </b-navbar-item>
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
