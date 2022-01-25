<template>
  <div class="box">
    <section v-if="mode=='Menu'">
      <b-button @click="gotoImport()">Import</b-button>
      <b-button @click="gotoCreate()">Create</b-button>
    </section>
    <section v-if="mode=='Import' || mode=='Create'">
      <b-button @click="back()">Back</b-button>
      <b-field label="Mnemonic" label-position="on-border">
        <b-input type="textarea" v-model="seedMnemonic"></b-input>
      </b-field>
      <b-button v-if="mode=='Create'" @click="refresh()">Refresh</b-button>
      <b-button @click="confirm()">Confirm</b-button>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store";
import { generateMnemonic } from "bip39";
import utility from "../store/utility";

type Mode = "Menu" | "Import" | "Create";

@Component
export default class CreateSeed extends Vue {
  public seedMnemonic = "";
  public mode: Mode = "Menu";

  gotoImport() {
    this.mode = "Import";
    this.seedMnemonic = "";
  }

  gotoCreate() {
    this.refresh();
    this.mode = "Create";
  }

  refresh() {
    this.seedMnemonic = utility.generateSeed();
  }

  back() {
    this.mode = "Menu";
  }

  confirm() {
    store.dispatch("importSeed", this.seedMnemonic);
  }
}
</script>

<style scoped lang="scss">
</style>
