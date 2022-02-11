<template>
  <div class="create-seed-wrapper">
    <div class="columns is-centered">
      <div class="box p-6">
        <div class="buttons">
          <section v-if="mode == 'Menu'">
            <b-button @click="gotoImport()" icon-left="import">{{ $t("createSeed.ui.button.import") }}</b-button>
            <b-button @click="gotoCreate()" icon-left="file-plus">{{ $t("createSeed.ui.button.create") }}</b-button>
          </section>
          <section v-if="mode == 'Import' || mode == 'Create'">
            <b-button @click="back()">{{ $t("createSeed.ui.button.back") }}</b-button>
            <b-field :label="$t('createSeed.ui.label.mnemonic')" label-position="on-border">
              <b-input type="textarea" v-model="seedMnemonic"></b-input>
            </b-field>
            <b-button v-if="mode == 'Create'" @click="refresh()">{{ $t("createSeed.ui.button.refresh") }}</b-button>
            <b-button @click="confirm()">{{ $t("createSeed.ui.button.confirm") }}</b-button>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import account from "../services/crypto/account";

type Mode = "Menu" | "Import" | "Create";

@Component
export default class CreateSeed extends Vue {
  public seedMnemonic = "";
  public mode: Mode = "Menu";

  gotoImport(): void {
    this.mode = "Import";
    this.seedMnemonic = "";
  }

  gotoCreate(): void {
    this.refresh();
    this.mode = "Create";
  }

  refresh(): void {
    this.seedMnemonic = account.generateSeed();
  }

  back(): void {
    this.mode = "Menu";
  }

  confirm(): void {
    store.dispatch("importSeed", this.seedMnemonic);
  }
}
</script>

<style scoped lang="scss">
.create-seed-wrapper {
  display: table-cell;
  vertical-align: middle;
}
</style>
