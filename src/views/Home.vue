<template>
  <div class="home">
    <verify-password v-if="!password"></verify-password>
    <create-seed v-else-if="!mnemonic"></create-seed>
    <account-detail v-else></account-detail>
    <self-test v-if="!unlocked"></self-test>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CreateSeed from "@/components/CreateSeed.vue";
import VerifyPassword from "@/components/VerifyPassword.vue";
import AccountDetail from "@/components/AccountDetail.vue";
import SelfTest from "@/components/SelfTest.vue";
import store from '@/store';

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
  get password(): string {
    return store.state.vault.password;
  }
  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }
}
</script>
