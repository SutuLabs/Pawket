<template>
  <div class="column is-6 is-offset-3">
    <div :class="{ box: !isMobile }">
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Create extends Vue {
  get isMobile(): boolean {
    return isMobile();
  }

  get hasAccount(): boolean {
    return store.state.vault.passwordHash != null;
  }

  mounted(): void {
    if (this.hasAccount) this.$router.push("/home").catch(() => undefined);
  }
}
</script>

<style scoped lang="scss"></style>
