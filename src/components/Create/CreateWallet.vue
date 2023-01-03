<template>
  <div>
    <top-bar :title="$t('createWallet.title')" @close="back()" :showBack="true"></top-bar>
    <section class="modal-card-body">
      <p class="pt-4 has-text-centered">
        <b-button @click="addAcc()" type="is-primary" icon-left="wallet-plus" outlined class="px-6" expanded>{{
          $t("createWallet.button.create")
        }}</b-button>
      </p>
      <p class="pt-4 has-text-centered">
        <b-button @click="importAcc()" type="is-primary" icon-left="import" outlined class="px-6" expanded>{{
          $t("createWallet.button.import")
        }}</b-button>
      </p>
      <p class="pt-4 has-text-centered">
        <b-button @click="importBackup()" type="is-primary" icon-left="upload" outlined class="px-6" expanded>{{
          $t("createWallet.button.backup")
        }}</b-button>
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class Disclaimer extends Vue {
  isAccept = false;
  addAcc(): void {
    localStorage.setItem("method", "add");
    this.$router.push("/create/create-password");
  }

  importAcc(): void {
    localStorage.setItem("method", "import");
    this.$router.push("/create/create-password");
  }

  importBackup(): void {
    this.$router.push("/create/import-backup");
  }

  back(): void {
    this.$router.push("/create/disclaimer");
  }
}
</script>

<style scoped lang="scss">
.create-option {
  min-width: 200px;
}
</style>
