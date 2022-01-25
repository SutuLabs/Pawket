<template>
  <div class="home">
    <verify-password v-if="!password"></verify-password>
    <create-seed v-else-if="!mnemonic"></create-seed>
    <account-detail v-else></account-detail>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import HelloWorld from "@/components/HelloWorld.vue"; // @ is an alias to /src
import CreateSeed from "@/components/CreateSeed.vue";
import VerifyPassword from "@/components/VerifyPassword.vue";
import AccountDetail from "@/components/AccountDetail.vue";
import store from "@/store";

@Component({
  components: {
    HelloWorld,
    CreateSeed,
    VerifyPassword,
    AccountDetail,
  },
})
export default class Home extends Vue {
  get mnemonic(): string {
    return store.state.seedMnemonic;
  }
  get password(): string {
    return store.state.password;
  }
}
</script>
