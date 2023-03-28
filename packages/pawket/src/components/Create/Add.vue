<template>
  <div class="add-container">
    <top-bar :title="$t('newWallet.title')" :showBack="true" @close="back()"></top-bar>
    <section class="modal-card-body">
      <p class="pt-5">
        {{ $t("createSeed.ui.text.create.tip1") }}
      </p>
      <p class="pt-4 has-text-danger has-text-weight-bold">
        {{ $t("createSeed.ui.text.create.tip2") }}
      </p>
    </section>
    <div class="px-2 mb-4 has-text-centered">
      <b-tag
        class="is-justify-content-left py-5 word-button is-size-5 m-2"
        type="is-info is-light"
        v-for="(m, index) in seedMnemonicList"
        :key="index"
      >
        <p class="has-text-grey is-size-7">{{ index + 1 }}</p>
        {{ m }}
      </b-tag>
    </div>
    <div class="has-text-centered">
      <b-button v-if="debugMode" rounded @click="later()">{{ $t("createSeed.ui.button.later") }}</b-button>
      <b-button icon-right="chevron-right" type="is-primary" @click="ready()" :loading="isLoading" class="px-6">{{
        $t("createSeed.ui.button.ready")
      }}</b-button>
    </div>
  </div>
</template>
<script lang="ts">
import account from "@/services/crypto/account";
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

@Component({
  components: {
    TopBar,
  },
})
export default class Add extends Vue {
  isLoading = false;

  get seedMnemonic(): string {
    return account.generateSeed();
  }
  get seedMnemonicList(): string[] {
    return this.seedMnemonic.split(" ");
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  later(): void {
    store.dispatch("importSeed", this.seedMnemonic);
  }

  async ready(): Promise<void> {
    this.isLoading = true;
    await store.dispatch("importSeed", this.seedMnemonic);
    this.$router.push("/home").catch(() => undefined);
    this.isLoading = false;
  }

  back(): void {
    this.$router.push("/create/create-password");
  }
}
</script>

<style scoped lang="scss">
.add-container {
  max-width: 700px;
  margin: auto;
}
.word-button {
  width: 9rem;
}
</style>
