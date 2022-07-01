<template>
  <div class="home">
    <b-loading v-if="loading" :is-full-page="true" v-model="loading"></b-loading>
    <verify-password v-if="!password"></verify-password>
    <account-detail v-else></account-detail>
    <div v-if="!loading" class="sticky">
      <self-test v-if="!unlocked"></self-test>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CreateSeed from "@/components/CreateSeed.vue";
import VerifyPassword from "@/components/VerifyPassword.vue";
import AccountDetail from "@/components/AccountDetail.vue";
import SelfTest from "@/components/SelfTest.vue";
import store from "@/store";

@Component({
  components: {
    CreateSeed,
    VerifyPassword,
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

  mounted(): void {
    if (!localStorage.getItem("SETTINGS")) {
      this.$router.push("/create");
    }
  }
}
</script>

<style lang="scss">
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
