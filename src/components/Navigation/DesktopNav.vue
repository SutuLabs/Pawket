<template>
  <div class="py-4" v-if="showNavigation">
    <router-link to="/home">
      <b-button
        icon-left="wallet"
        type="is-primary"
        outlined
        :class="{
          'border-less': true,
          'has-background-primary': path.match(/^\/home\/?/),
          'has-text-white': path.match(/^\/home\/?/),
        }"
      >
        {{ $t("app.ui.navigation.wallet") }}
      </b-button>
    </router-link>
    <router-link to="/cns">
      <b-button
        icon-left="dns"
        type="is-primary"
        outlined
        v-if="debugMode || test"
        :class="{
          'border-less': true,
          'has-background-primary': path.match(/^\/cns\/?/),
          'has-text-white': path.match(/^\/cns\/?/),
        }"
      >
        {{ $t("app.ui.navigation.cns") }}
      </b-button>
    </router-link>
    <router-link to="/explore">
      <b-button
        icon-left="earth"
        type="is-primary"
        outlined
        :class="{
          'border-less': true,
          'has-background-primary': path.match(/^\/explore\/?/),
          'has-text-white': path.match(/^\/explore\/?/),
        }"
      >
        {{ $t("app.ui.navigation.explore") }}
      </b-button>
    </router-link>
    <router-link to="/settings/general">
      <b-button
        icon-left="cog"
        type="is-primary"
        :class="{
          'border-less': true,
          'has-background-primary': path.match(/^\/settings\/?/),
          'has-text-white': path.match(/^\/settings\/?/),
        }"
        outlined
      >
        {{ $t("app.ui.navigation.settings") }}
      </b-button>
    </router-link>
  </div>
</template>
<script lang="ts">
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class DesktopNav extends Vue {
  get path(): string {
    return this.$route.path;
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

  get test(): boolean {
    return window.location.hostname == "kitten.pawket.app";
  }
}
</script>
<style scoped lang="scss">
.border-less {
  border: none;
}
</style>
