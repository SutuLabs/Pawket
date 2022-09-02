<template>
  <div id="app" ref="container">
    <b-notification type="is-primary" class="column is-6 is-offset-3" style="position: fixed; top: 0; z-index: 100" v-if="test">
      {{ $t("accountDetail.message.notification.test") }}
    </b-notification>
    <nav-bar></nav-bar>
    <router-view />
    <mobile-nav v-if="showNavigation"></mobile-nav>
    <div class="my-3 is-hidden-tablet">&nbsp;</div>
    <div class="my-6 is-hidden-mobile">&nbsp;</div>
    <pawket-footer></pawket-footer>
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
  @Watch("path")
  scrollTop(): void {
    const container = this.$refs.container as Element;
    if (container) container.scrollIntoView();
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

  mounted(): void {
    store.state.app.debug = localStorage.getItem("DEBUG_MODE") ? localStorage.getItem("DEBUG_MODE") === "true" : false;
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

#app {
  width: 100%;
  height: 100%;
}
</style>
