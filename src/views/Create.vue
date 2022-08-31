<template>
  <div class="column is-6 is-offset-3" v-if="!loading">
    <div class="box is-hidden-mobile">
      <router-view></router-view>
    </div>
    <div class="is-hidden-tablet">
      <router-view></router-view>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";

@Component
export default class Create extends Vue {
  get hasAccount(): boolean {
    return !!store.state.vault.passwordHash && !!store.state.vault.seedMnemonic;
  }

  get loading(): boolean {
    return store.state.vault.loading;
  }

  mounted(): void {
    if (this.hasAccount) this.$router.push("/home");
  }
}
</script>

<style scoped lang="scss"></style>
