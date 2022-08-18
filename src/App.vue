<template>
  <div id="app" ref="container">
    <b-notification type="is-primary" class="column is-6 is-offset-3" style="position: fixed; top: 0; z-index: 100;" v-if="test">
      {{ $t("accountDetail.message.notification.test") }}
    </b-notification>
    <nav-bar></nav-bar>
    <div v-if="unlocked == false && hasAccount && path != '/clvm' && path != '/developer'" :class="{'pt-6': !isMobile, 'mt-6': !isMobile}">
      <verify-password></verify-password>
    </div>
    <div v-else>
      <router-view />
    </div>
    <mobile-nav v-if="showNavigation"></mobile-nav>
    <div class="my-3 is-hidden-tablet">&nbsp;</div>
    <footer class="footer" :class="{ 'is-hidden-mobile': unlocked }">
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
import DevHelper from "@/components/DevHelper/DevHelper.vue";
import { xchPrefix } from "./store/modules/network";
import VerifyPassword from "@/components/Login/VerifyPassword.vue";
import MobileNav from "./components/Navigation/MobileNav.vue";
import NavBar from "./components/Navigation/Navbar.vue";
import { tc } from "./i18n/i18n";
import { isMobile } from "./services/view/responsive";

@Component({ components: { VerifyPassword, MobileNav, NavBar } })
export default class App extends Vue {
  public debugClick = 9;

  @Watch("path")
  scrollTop(): void {
    const container = this.$refs.container as Element;
    if (container) container.scrollIntoView();
  }

  get version(): string {
    return process.env.VUE_APP_VERSION || tc("footer.ui.error.READ_VERSION_FAILED");
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get isMobile():boolean {
    return isMobile()
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
      fullScreen: isMobile(),
      canCancel: [""],
    });
  }

  get test(): boolean {
    return window.location.hostname == "kitten.pawket.app";
  }

  async showProxy(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Offline/OfflineQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
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
</style>
