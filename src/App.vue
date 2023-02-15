<template>
  <div id="app" ref="container">
    <div v-if="!path.startsWith('/connect')">
      <b-notification type="is-primary" class="column is-6 is-offset-3" style="position: fixed; top: 0; z-index: 100" v-if="test">
        {{ $t("accountDetail.message.notification.test") }}
      </b-notification>
      <nav-bar></nav-bar>
      <keep-alive>
        <router-view />
      </keep-alive>
      <mobile-nav v-if="showNavigation"></mobile-nav>
      <div class="my-3 is-hidden-tablet">&nbsp;</div>
      <div class="my-6 is-hidden-mobile">&nbsp;</div>
      <pawket-footer></pawket-footer>
    </div>
    <router-view v-else />
  </div>
</template>
<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "./store";
import VerifyPassword from "@/components/Login/VerifyPassword.vue";
import MobileNav from "./components/Navigation/MobileNav.vue";
import NavBar from "./components/Navigation/Navbar.vue";
import PawketFooter from "./components/Footer/Footer.vue";

@Component({ components: { VerifyPassword, MobileNav, NavBar, PawketFooter } })
export default class App extends Vue {
  public timeoutId?: ReturnType<typeof setTimeout>;
  public lastActive = Date.now();

  @Watch("path")
  scrollTop(): void {
    const container = this.$refs.container as Element;
    if (container) container.scrollIntoView();
  }

  refreshActiveTime(): void {
    this.lastActive = Date.now();
  }

  get path(): string {
    return this.$route.path;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  @Watch("unlocked")
  onUnlockedChange(): void {
    if (this.unlocked) {
      this.timeoutId = setTimeout(() => this.checkLock(60), 1000 * 60);
    } else {
      if (this.timeoutId) clearTimeout(this.timeoutId);
    }
  }

  get showNavigation(): boolean {
    return !this.$route.path.startsWith("/create") && this.unlocked;
  }

  mounted(): void {
    store.state.app.debug = localStorage.getItem("DEBUG_MODE") ? localStorage.getItem("DEBUG_MODE") === "true" : false;
    document.body.addEventListener("mouseover", this.refreshActiveTime);
    const theme = localStorage.getItem("user-theme") ?? "light-theme";
    document.documentElement.className = theme;
  }

  get autoLockTime(): number {
    return Number(localStorage.getItem("AUTO_LOCK_TIME") ?? "900");
  }

  autoLock(): void {
    const diff = Date.now() - this.lastActive;
    if (diff > this.autoLockTime * 1000) {
      location.reload();
    }
  }

  checkLock(sec = 30): void {
    this.autoLock();
    if (this.unlocked) {
      this.timeoutId = setTimeout(() => this.checkLock(sec), 1000 * sec);
    }
  }

  get test(): boolean {
    return window.location.hostname == "kitten.pawket.app";
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

.qrcode {
  margin: auto;
}

:root.dark-theme {
  @import "@/styles/cyborg/bulmaswatch.scss";

  #app,
  .navbar,
  .home,
  body,
  .has-background,
  .modal-card-head,
  html {
    background-color: $grey-accent;
    color: $white-ter;
  }

  .navbar-item,
  .fixed-top {
    background-color: $grey-accent !important;
  }

  .panel-block {
    background-color: $grey-accent;
    color: $white-ter;
  }

  .panel-block:not(:last-child),
  .border-top-1,
  .border-bottom {
    border-color: $grey;
  }

  .tabs a {
    color: $white-ter;
    border-color: $grey;
  }

  .has-text-grey-dark,
  .has-text-dark,
  .modal-card-title,
  .card-header-title,
  .card,
  th {
    color: $white-ter !important;
  }

  .modal-card-foot,
  .is-white,
  .dropdown-content,
  .b-slider-thumb {
    background-color: $grey-darker;
  }

  .input,
  .select select,
  textarea,
  .has-background-white-ter {
    background-color: $grey-darker !important;
    color: $white-ter !important;
    border-color: $grey;
  }

  .panel-block:hover {
    background-color: $grey-darker !important;
  }

  .checkbox {
    display: inline-flex;
  }

  .dropdown.is-bottom-left .dropdown-menu {
    right: 0;
    left: auto;
  }

  hr {
    color: $grey;
  }

  .b-radio.radio {
    outline: none;
    display: inline-flex;
    align-items: center;
  }

  .button {
    background-color: $grey-accent;
  }

  .border-less {
    border: 0;
  }

  .box {
    box-shadow: 0 0.5em 2em 0 rgb(255 255 255 / 10%), 0 0px 0 1px rgb(255 255 255 / 5%);
  }

  .qrcode {
    background-color: white;
    padding: 10px;
    margin: auto;
  }
}
</style>
