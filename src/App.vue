<template>
  <div id="app">
    <!-- <b-navbar type="is-light">
      <template #brand>
        <b-navbar-item tag="router-link" :to="{ path: '/' }" :exact="true">Wallet</b-navbar-item>
      </template>
      <template #start>
        <b-navbar-item tag="router-link" :to="{ path: '/about' }">About</b-navbar-item>
      </template>
      <template #end>
        <profile-corner :login-info="loginInfo"></profile-corner>
      </template>
    </b-navbar>
    <div class="container">-->
    <router-view />
    <!-- </div> -->
    <footer class="footer">
      <div class="content has-text-centered">
        <p>
          <strong>Chiabee Wallet</strong>
          [{{ version }}] by <a href="https://www.chiabee.net">Chiabee</a>. <br />The
          <a href="http://github.com/chiabee">source code</a> would available later. This app is in
          <span @click="alphaClick()">ALPHA</span> stage, don't use in PRODUCTION.
          <span v-if="debugMode" @click="disableDebug()">[DEBUG]</span>
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
import store from './store';

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
}
</script>

<style lang="scss"></style>
