<template>
  <div class="width-700">
    <top-bar :title="$t('createWallet.title')" @close="back()"></top-bar>
    <section class="modal-card-body">
      <p class="pt-4 has-text-centered">
        <b-button @click="addAcc()" type="is-primary" icon-left="wallet-plus" outlined class="px-6">{{
          $t("createWallet.button.create")
        }}</b-button>
      </p>
      <p class="pt-4 has-text-centered">
        <b-button @click="importAcc()" type="is-primary" icon-left="import" outlined class="px-6">{{
          $t("createWallet.button.import")
        }}</b-button>
      </p>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import TopBar from "../TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class Disclaimer extends Vue {
  isAccept = false;
  addAcc(): void {
    this.$router.push("/create/add");
  }

  importAcc(): void {
    this.$router.push("/create/import");
  }

  back(): void {
    this.$router.push("/create/create-password");
  }
}
</script>

<style scoped lang="scss">
.width-700 {
  max-width: 700px;
  margin: auto;
}
</style>
