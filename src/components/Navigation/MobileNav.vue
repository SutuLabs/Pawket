<template>
  <nav class="navbar is-link is-fixed-bottom is-hidden-tablet top-border" role="navigation">
    <div class="navbar-brand">
      <router-link
        :to="'/home'"
        :class="{
          'navbar-item': true,
          'is-expanded': true,
          'is-block': true,
          'has-text-centered': true,
          'has-text-grey': !path.match(/^\/home\/?/),
          'has-text-primary': path.match(/^\/home\/?/),
        }"
      >
        <b-icon icon="wallet"></b-icon>
        <p class="is-size-7">{{ $t("app.ui.navigation.wallet") }}</p>
      </router-link>
      <router-link
        :to="'/cns'"
        v-if="debugMode || test"
        :class="{
          'navbar-item': true,
          'is-expanded': true,
          'is-block': true,
          'has-text-centered': true,
          'has-text-grey': !path.match(/^\/cns\/?/),
          'has-text-primary': path.match(/^\/cns\/?/),
        }"
      >
        <b-icon icon="dns"></b-icon>
        <p class="is-size-7">{{ $t("app.ui.navigation.cns") }}</p>
      </router-link>
      <router-link
        :to="'/explore'"
        :class="{
          'navbar-item': true,
          'is-expanded': true,
          'is-block': true,
          'has-text-centered': true,
          'has-text-grey': !path.match(/^\/explore\/?/),
          'has-text-primary': path.match(/^\/explore\/?/),
        }"
      >
        <b-icon icon="earth"></b-icon>
        <p class="is-size-7">{{ $t("app.ui.navigation.explore") }}</p>
      </router-link>
      <router-link
        :to="'/settings'"
        :active="path == '/settings'"
        :class="{
          'navbar-item': true,
          'is-expanded': true,
          'is-block': true,
          'has-text-centered': true,
          'has-text-grey': !path.match(/^\/settings\/?/),
          'has-text-primary': path.match(/^\/settings\/?/),
        }"
      >
        <b-icon icon="cog"></b-icon>
        <p class="is-size-7">{{ $t("app.ui.navigation.settings") }}</p>
      </router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class MobileNav extends Vue {
  get path(): string {
    return this.$route.path;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get test(): boolean {
    return window.location.hostname == "kitten.pawket.app";
  }
}
</script>
<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

a.has-text-primary:hover,
a.has-text-primary:focus {
  color: $primary !important;
}

.top-border {
  border-top: 1px solid #ededed;
}

.navbar-item {
  background-color: $white-ter !important;
}
</style>
