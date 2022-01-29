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
          <a href="http://github.com/chiabee">source code</a> would available later. This app is in ALPHA stage, don't use in
          PRODUCTION.
        </p>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class ProfileCorner extends Vue {
  get version(): string {
    return process.env.VUE_APP_VERSION || "";
  }
}
</script>

<style lang="scss"></style>
