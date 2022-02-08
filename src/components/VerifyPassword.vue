<template>
  <div class="box">
    <section v-if="mode == 'Verify'">
      <b-field label="Password" label-position="on-border">
        <b-input type="password" @keyup.native.enter="confirm()" v-model="password"></b-input>
      </b-field>
      <b-button @click="confirm()">Confirm</b-button>
      <b-button v-if="showClear" type="is-danger" @click="clear()">Clear Data</b-button>
    </section>

    <section v-if="mode == 'Create'">
      <b-field label="Password" label-position="on-border">
        <b-input type="password" v-model="password"></b-input>
      </b-field>
      <b-field label="Re-enter" label-position="on-border">
        <b-input type="password" @keyup.native.enter="create()" v-model="repassword"></b-input>
      </b-field>
      <b-button @click="create()">Create</b-button>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import utility from '@/services/crypto/utility';

type Mode = "Verify" | "Create";

@Component
export default class VerifyPassword extends Vue {
  public password = "";
  public repassword = "";
  public mode: Mode = "Verify";
  public showClear = false;

  mounted(): void {
    this.mode = store.state.vault.passwordHash ? "Verify" : "Create";
  }

  async confirm(): Promise<void> {
    const pswhash = await utility.hash(this.password)
    if (pswhash != store.state.vault.passwordHash) {
      this.showClear = true;
      return;
    }
    await store.dispatch("unlock", this.password);
  }

  create(): void {
    if (this.repassword != this.password) return;
    store.dispatch("setPassword", this.password);
  }

  clear(): void {
    this.$buefy.dialog.confirm({
      message: `Clear all data? Everything would empty!!!`,
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("clear");
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
