<template>
  <div class="import-container">
    <div v-if="mode == 'Menu'">
      <top-bar :title="$t('importWallet.title')" @close="back()" :showBack="true"></top-bar>
      <div class="columns pt-6 is-centered">
        <div class="column is-5 menu-btn is-white is-clickable mx-3 mt-4 p-3" @click="import12()">
          <h2 class="is-size-2 has-text-weight-bold has-text-primary">{{ $t("createSeed.ui.button.12word") }}</h2>
          <p class="is-size-6 has-text-dark">{{ $t("createSeed.ui.button.import12") }}</p>
        </div>
        <div class="column is-5 menu-btn is-white is-clickable mx-3 mt-4 p-3" @click="import24()">
          <h2 class="is-size-2 has-text-weight-bold has-text-grey">{{ $t("createSeed.ui.button.24word") }}</h2>
          <p class="is-size-6 has-text-dark">{{ $t("createSeed.ui.button.import24") }}</p>
        </div>
      </div>
    </div>
    <div v-if="mode == 'Import'">
      <section v-if="mnemonicLen == 12">
        <top-bar :title="$t('createSeed.ui.text.import12.title')" @close="backToImportMenu()" :showBack="true"></top-bar>
        <p class="is-size-6 p-5">{{ $t("createSeed.ui.text.import12.tip") }}</p>
      </section>
      <section v-if="mnemonicLen == 24">
        <top-bar :title="$t('createSeed.ui.text.import24.title')" @close="backToImportMenu()" :showBack="true"></top-bar>
        <p class="is-size-6 p-5">{{ $t("createSeed.ui.text.import24.tip") }}</p>
      </section>
      <div class="px-5">
        <b-field :type="isLegal ? '' : 'is-danger'" :message="isLegal ? '' : $t('createSeed.message.error.wrongSeed')">
          <b-input type="textarea" v-model="seedMnemonic" @input="clearErrorMsg()"></b-input>
        </b-field>
      </div>
      <div class="has-text-centered">
        <b-button :loading="submitting" type="is-primary" class="px-6 mt-5" @click="confirm()">{{
          $t("createSeed.ui.button.confirm")
        }}</b-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import store from "@/store";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "@/components/Common/TopBar.vue";

type Mode = "Menu" | "Import";
type MnemonicLen = 12 | 24;

@Component({
  components: {
    TopBar,
  },
})
export default class Add extends Vue {
  mode: Mode = "Menu";
  public isLegal = true;
  public mnemonicLen: MnemonicLen = 12;
  seedMnemonic = "";
  seedMnemonicList: string[] = [];
  submitting = false;

  import12(): void {
    this.mnemonicLen = 12;
    this.mode = "Import";
  }

  import24(): void {
    this.mnemonicLen = 24;
    this.mode = "Import";
  }

  clearErrorMsg(): void {
    this.isLegal = true;
  }

  async confirm(): Promise<void> {
    this.isLegal = true;
    this.submitting = true;
    this.seedMnemonic = this.seedMnemonic.replace(/\s+/g, " ").trim();
    this.seedMnemonicList = this.seedMnemonic.split(" ");
    if (this.seedMnemonicList.length != this.mnemonicLen) {
      this.isLegal = false;
      this.submitting = false;
      return;
    }
    await store.dispatch("importSeed", this.seedMnemonic).catch((error) => (this.isLegal = error == null));
    this.submitting = false;
    this.$router.push("/home").catch(() => undefined);
  }

  backToImportMenu(): void {
    this.mode = "Menu";
    this.isLegal = true;
    this.seedMnemonic = "";
  }

  back(): void {
    this.$router.push("/create/create-password");
  }
}
</script>

<style scoped lang="scss">
.import-container {
  height: 80vh;
  overflow-x: hidden;
}
.menu-btn {
  border-radius: 6px;
  box-shadow: 0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%);
  color: #4a4a4a;
  text-align: center;
  :hover {
    cursor: pointer;
  }
}
</style>
