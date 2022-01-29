<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Account Export</p>
      <b-button class="is-pulled-right" type="is-small" @click="showMnemonic()">Show Mnemonic</b-button>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <a class="panel-block" v-for="(account, idx) in accounts" :key="idx">
        <span class="panel-icon">✨</span>
        <span @click="select(idx)">{{ account.name }}: {{ account.key.fingerprint }} [{{ account.type }}]</span>
        <span class="is-pulled-right" @click="remove(idx)">🗑️</span>
        <span class="is-pulled-right" @click="rename(idx)">📝️</span>
        <span class="is-pulled-right" @click="showExport(account)">🖨️️</span>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()">
        <span class="panel-icon">➕</span>
        Add By Password
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <span class="panel-icon">➕</span>
        Add By Serial
      </a>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store";
import { Account } from "@/store/index";
import AccountExport from "@/components/AccountExport.vue";

@Component
export default class AccountList extends Vue {
  @Prop() private account!: Account;

  get accounts(): Account[] {
    return store.state.accounts;
  }

  get accountIndex(): number {
    return store.state.selectedAccount;
  }

  @Emit("close")
  close(): void {
    return;
  }

  copy(text: string): void {
    store.dispatch("copy", text);
  }

  select(idx: number): void {
    store.state.selectedAccount = idx;
    this.close();
  }

  remove(idx: number): void {
    store.dispatch("removeAccount", idx);
  }

  async rename(idx: number): Promise<void> {
    const name = await this.getAccountName();
    store.dispatch("renameAccount", { idx, name });
  }

  async addByPassword(): Promise<void> {
    const name = await this.getAccountName();
    const password = await this.getPassword();
    store.dispatch("createAccountByPassword", { name, password });
  }

  addBySerial(): void {
    this.getAccountName().then((name) => {
      store.dispatch("createAccountBySerial", name);
    });
  }

  getAccountName(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: `Enter the new account name`,
        trapFocus: true,
        onConfirm: (name) => {
          resolve(name);
        },
      });
    });
  }

  getPassword(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: `Enter the password`,
        trapFocus: true,
        inputAttrs: {
          type: "password",
        },
        onConfirm: (name) => {
          resolve(name);
        },
      });
    });
  }

  showExport(account: Account): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountExport,
      hasModalCard: true,
      trapFocus: true,
      props: { account },
    });
  }

  showMnemonic(): void {
    this.$buefy.dialog.alert({
      message: `Mnemonic:<br/>${store.state.seedMnemonic}`,
      trapFocus: true,
      type: "is-danger",
    });
  }
}
</script>

<style scoped lang="scss"></style>
