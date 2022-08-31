<template>
  <div class="py-4" v-if="showNavigation">
    <b-button
      @click="$router.push('/home')"
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
    <b-button
      @click="$router.push('/cns')"
      icon-left="dns"
      type="is-primary"
      outlined
      v-if="debugMode"
      :class="{
        'border-less': true,
        'has-background-primary': path.match(/^\/cns\/?/),
        'has-text-white': path.match(/^\/cns\/?/),
      }"
    >
      {{ $t("app.ui.navigation.cns") }}
    </b-button>
    <b-button
      @click="$router.push('/explore')"
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
    <b-button
      @click="$router.push('/settings')"
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
}
</script>
<style scoped lang="scss">
.border-less {
  border: none;
}
</style>
