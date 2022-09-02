<template>
  <div class="home">
    <b-loading v-if="loading" :is-full-page="true" v-model="loading"></b-loading>
    <account-detail v-if="!loading && unlocked"></account-detail>
    <div v-if="!loading" class="sticky">
      <self-test v-if="!unlocked"></self-test>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import AccountDetail from "@/components/Home/AccountDetail.vue";
import SelfTest from "@/components/Common/SelfTest.vue";
import store from "@/store";

@Component({
  components: {
    AccountDetail,
    SelfTest,
  },
})
export default class Home extends Vue {
  get mnemonic(): string {
    return store.state.vault.seedMnemonic;
  }

  get password(): boolean {
    return !!store.state.vault.encryptKey;
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  get loading(): boolean {
    return store.state.vault.loading;
  }

  get passwordHash(): string {
    return store.state.vault.passwordHash;
  }

  get hasAccount(): boolean {
    return store.state.vault.passwordHash != null;
  }

  mounted(): void {
    if (!this.hasAccount) this.$router.push("/create").catch(() => undefined);
  }
}
</script>

<style scoped lang="scss">
.home {
  width: 100%;
  height: 70%;
  display: table;
}

.sticky {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  z-index: 1000;
}
</style>
