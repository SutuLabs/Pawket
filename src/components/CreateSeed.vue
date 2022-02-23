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
        <h4 class="is-size-4">{{ $t("createSeed.ui.text.importMenu.title") }}</h4>
        <p class="is-size-5">{{ $t("createSeed.ui.text.importMenu.tips") }}</p>
        <ol class="is-size-6">
          <li>{{ $t("createSeed.ui.text.importMenu.tip1") }}</li>
          <li>{{ $t("createSeed.ui.text.importMenu.tip2") }}</li>
        </ol>
      </div>
      <div class="import-wrapper">
        <a @click="import12()">
          <div class="import-box">
            <img class="logo" src="../assets/logo.svg" />
            <p class="is-size-6">{{ $t("createSeed.ui.button.import12") }}</p>
          </div>
        </a>
        <a @click="import24()" class="isDisabled">
          <div class="import-box gray">
            <img class="logo" src="../assets/chia-logo.svg" />
            <p class="is-size-6">{{ $t("createSeed.ui.button.import24") }}</p>
            <p class="is-size-6">{{ $t("createSeed.ui.button.comingSoon") }}</p>
          </div>
        </a>
      </div>
    </div>
    <div v-if="mode == 'Import12'">
      <div class="block content centered">
        <div class="buttons">
          <b-button icon-left="chevron-left" rounded @click="back()">{{ $t("createSeed.ui.button.back") }}</b-button>
        </div>
        <h4 class="is-size-4">{{ $t("createSeed.ui.text.import12.title") }}</h4>
        <p class="is-size-6">{{ $t("createSeed.ui.text.import12.tip") }}</p>
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
        <p class="is-size-5">{{ $t("createSeed.ui.text.create.tips") }}</p>
        <ol class="is-size-6">
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
        <b-button rounded @click="later()">{{ $t("createSeed.ui.button.later") }}</b-button>
        <b-button rounded type="is-success" @click="ready()">{{ $t("createSeed.ui.button.ready") }}</b-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import account from "../services/crypto/account";

type Mode = "Menu" | "ImportMenu" | "Import12" | "Create";

@Component
export default class CreateSeed extends Vue {
  public seedMnemonic = "";
  public seedMnemonicList: string[] = [];
  public mode: Mode = "Menu";
  public isLegal = true;

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
    this.mode = "Import12";
  }

  import24(): void {
    // TODO: support import 24
    return;
  }

  confirm(): void {
    this.isLegal = true;
    this.seedMnemonicList = this.seedMnemonic.trim().split(" ");
    console.log(this.seedMnemonicList);
    if (this.seedMnemonicList.length != 12) {
      this.isLegal = false;
      return;
    }
    store.dispatch("importSeed", this.seedMnemonic);
  }

  back(): void {
    this.mode = "Menu";
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
.import-wrapper {
  width: 50%;
  margin: auto;
  display: flex;
  justify-content: left;
}
.import-box {
  width: 16rem;
  height: 10rem;
  margin-right: 6rem;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 0.5em 1em -0.125em rgb(10 10 10 / 10%), 0 0 0 1px rgb(10 10 10 / 2%);
  color: #4a4a4a;
  padding: 1.25rem;
  text-align: center;
}
.logo {
  width: 10rem;
  height: 3rem;
  margin-bottom: 1rem;
}
.gray {
  filter: grayscale(100%);
}
.isDisabled {
  cursor: not-allowed;
}
.word-button {
  width: 6rem;
  height: 2rem;
  margin: 0.5rem;
}
</style>
