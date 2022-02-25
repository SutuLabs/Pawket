<template>
  <div :class="mode === 'Menu' ? 'create-seed-wrapper' : ''">
    <div class="columns is-centered" v-if="mode == 'Menu'">
      <div class="box p-6">
        <div class="buttons">
          <b-button @click="gotoImport()" icon-left="import">{{ $t("createSeed.ui.button.import") }}</b-button>
          <b-button @click="gotoCreate()" icon-left="file-plus">{{ $t("createSeed.ui.button.create") }}</b-button>
        </div>
      </div>
    </div>
    <div v-if="mode == 'ImportMenu'">
      <div class="block content centered">
        <div class="buttons">
          <b-button icon-left="chevron-left" rounded @click="back()">{{ $t("createSeed.ui.button.back") }}</b-button>
        </div>
        <p class="is-size-4">{{ $t("createSeed.ui.text.importMenu.title") }}</p>
        <div class="columns">
          <div class="column is-half">
            <div class="menu-btn" @click="import12()">
              <h2 class="is-size-2 menu-title">{{ $t("createSeed.ui.button.12word") }}</h2>
              <p class="is-size-6">{{ $t("createSeed.ui.button.import12") }}</p>
            </div>
          </div>
          <div class="column is-half">
            <div class="menu-btn" @click="import24()">
              <h2 class="is-size-2 menu-title-black">{{ $t("createSeed.ui.button.24word") }}</h2>
              <p class="is-size-6">{{ $t("createSeed.ui.button.import24") }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="mode == 'Import'">
      <div class="block content centered">
        <div class="buttons">
          <b-button icon-left="chevron-left" rounded @click="backToImportMenu()">{{ $t("createSeed.ui.button.back") }}</b-button>
        </div>
        <section v-if="mnemonicLen == 12">
          <h4 class="is-size-4">{{ $t("createSeed.ui.text.import12.title") }}</h4>
          <p class="is-size-6">{{ $t("createSeed.ui.text.import12.tip") }}</p>
        </section>
        <section v-if="mnemonicLen == 24">
          <h4 class="is-size-4">{{ $t("createSeed.ui.text.import24.title") }}</h4>
          <p class="is-size-6">{{ $t("createSeed.ui.text.import24.tip") }}</p>
        </section>
        <b-field :type="isLegal ? '' : 'is-danger'" :message="isLegal ? '' : $t('createSeed.message.error.wrongSeed')">
          <b-input type="textarea" v-model="seedMnemonic"></b-input>
        </b-field>
        <b-button rounded type="is-success" @click="confirm()">{{ $t("createSeed.ui.button.confirm") }}</b-button>
      </div>
    </div>
    <div v-if="mode == 'Create'">
      <div class="block content centered">
        <div class="buttons">
          <b-button icon-left="chevron-left" rounded @click="back()">{{ $t("createSeed.ui.button.back") }}</b-button>
        </div>
        <h4 class="is-size-4">{{ $t("createSeed.ui.text.create.title") }}</h4>
        <p v-if="debugMode" class="is-size-5">{{ $t("createSeed.ui.text.create.tips") }}</p>
        <ol v-if="debugMode" class="is-size-6">
          <li>{{ $t("createSeed.ui.text.create.tip1") }}</li>
          <li>{{ $t("createSeed.ui.text.create.tip2") }}</li>
        </ol>
      </div>
      <div class="block centered">
        <b-tag class="word-button" type="is-info is-light" v-for="(m, index) in seedMnemonicList" :key="index">
          {{ index + 1 + ". " + m }}
        </b-tag>
      </div>
      <div class="block buttons centered">
        <b-button v-if="debugMode" rounded @click="later()">{{ $t("createSeed.ui.button.later") }}</b-button>
        <b-button rounded type="is-success" @click="ready()">{{ $t("createSeed.ui.button.ready") }}</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import account from "../services/crypto/account";

type Mode = "Menu" | "ImportMenu" | "Import" | "Create";
type MnemonicLen = 12 | 24;

@Component
export default class CreateSeed extends Vue {
  public seedMnemonic = "";
  public seedMnemonicList: string[] = [];
  public mode: Mode = "Menu";
  public isLegal = true;
  public mnemonicLen: MnemonicLen = 12;
  
  get debugMode(): boolean {
    return store.state.app.debug;
  }

  gotoImport(): void {
    this.mode = "ImportMenu";
    this.seedMnemonic = "";
  }

  gotoCreate(): void {
    this.refresh();
    this.mode = "Create";
  }

  refresh(): void {
    this.seedMnemonic = account.generateSeed();
    this.seedMnemonicList = this.seedMnemonic.split(" ");
  }

  later(): void {
    store.dispatch("importSeed", this.seedMnemonic);
  }

  ready(): void {
    // TODO: go to verify seed page
    store.dispatch("importSeed", this.seedMnemonic);
  }

  import12(): void {
    this.mnemonicLen = 12;
    this.mode = "Import";
  }

  import24(): void {
    this.mnemonicLen = 24;
    this.mode = "Import";
  }

  async confirm(): Promise<void> {
    this.isLegal = true;
    this.seedMnemonicList = this.seedMnemonic.trim().split(" ");
    if (this.seedMnemonicList.length != this.mnemonicLen) {
      this.isLegal = false;
      return;
    }
    await store.dispatch("importSeed", this.seedMnemonic).catch((error) => (this.isLegal = error == null));
  }

  back(): void {
    this.mode = "Menu";
  }

  backToImportMenu(): void {
    this.mode = "ImportMenu";
  }
}
</script>

<style scoped lang="scss">
.create-seed-wrapper {
  display: table-cell;
  vertical-align: middle;
}
.centered {
  width: 50%;
  margin: auto;
}
@media only screen and (max-width: 768px) {
  /* For mobile phones: */
  .centered {
    width: 90%;
  }
}

.menu-btn {
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%);
  color: #4a4a4a;
  padding: 1.25rem;
  text-align: center;
  :hover {
    cursor: pointer;
  }
}
.menu-title {
  font-weight: bold;
  color: #39c0ae;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}
.menu-title-black {
  font-weight: bold;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}
.word-button {
  width: 6rem;
  height: 2rem;
  margin: 0.5rem;
}
</style>
