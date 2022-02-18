<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("accountList.ui.title.list") }}</p>
      <b-button class="is-pulled-right mr-5" type="is-small" @click="showMnemonic()">{{
        $t("accountList.ui.button.showMnemonic")
      }}</b-button>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <a class="panel-block" v-for="(account, idx) in accounts" :key="idx">
        <span class="panel-icon">✨</span>
        <span @click="select(idx)">{{ account.name }}: {{ account.key.fingerprint }} [{{ account.type }}]</span>
        <span class="is-pulled-right" @click="remove(idx)" v-if="idx > 0">🗑️</span>
        <span class="is-pulled-right" @click="rename(idx)">📝️</span>
        <span class="is-pulled-right" @click="showExport(account)">🖨️️</span>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()">
        <span class="panel-icon">➕</span>
        {{ $t("accountList.ui.button.addByPassword") }}
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <span class="panel-icon">➕</span>
        {{ $t("accountList.ui.button.addBySerial") }}
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByLegacy()">
        <span class="panel-icon">➕</span>
        {{ $t("accountList.ui.button.addByLegacy") }}
      </a>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store";
import { AccountEntity } from "@/store/modules/account";
import AccountExport from "@/components/AccountExport.vue";
import MnemonicExport from "@/components/MnemonicExport.vue";
import { translate } from "@/i18n/i18n";

@Component
export default class AccountList extends Vue {
  @Prop() private account!: AccountEntity;

  get accounts(): AccountEntity[] {
    return store.state.account.accounts;
  }

  get accountIndex(): number {
    return store.state.account.selectedAccount;
  }

  @Emit("close")
  close(): void {
    return;
  }

  copy(text: string): void {
    store.dispatch("copy", text);
  }

  select(idx: number): void {
    store.state.account.selectedAccount = idx;
    store.dispatch("refreshBalance");
    this.close();
  }

  remove(idx: number): void {
    this.$buefy.dialog.confirm({
      message: translate("accountList.message.confirmation.removeAccount"),
      confirmText: translate("accountList.message.confirmation.confirmText"),
      cancelText: translate("accountList.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("removeAccount", idx);
      },
    });
  }

  async rename(idx: number): Promise<void> {
    const name = await this.getAccountName();
    store.dispatch("renameAccount", { idx, name });
  }

  async addByPassword(): Promise<void> {
    const name = await this.getAccountName();
    const password = await this.getPassword();
    store.dispatch("createAccountByPassword", { name, password })
    .catch(error => this.$buefy.dialog.alert(error.message));
  }

  addBySerial(): void {
    this.getAccountName().then((name) => {
      store.dispatch("createAccountBySerial", name);
    });
  }

  async addByLegacy(): Promise<void> {
    const name = await this.getAccountName();
    const legacyMnemonic = await this.getLegacyMnemonic();
    store.dispatch("createAccountByLegacyMnemonic", { name, legacyMnemonic })
    .catch(error => this.$buefy.dialog.alert(error.message));
  }

  getAccountName(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: translate("accountList.message.prompt.setAccountName"),
        confirmText: translate("accountList.message.prompt.confirmText"),
        cancelText: translate("accountList.message.prompt.cancelText"),
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
        message: translate("accountList.message.prompt.setPassword"),
        confirmText: translate("accountList.message.prompt.confirmText"),
        cancelText: translate("accountList.message.prompt.cancelText"),
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

  getLegacyMnemonic(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: translate("accountList.message.prompt.setLegacyMnemonic"),
        confirmText: translate("accountList.message.prompt.confirmText"),
        cancelText: translate("accountList.message.prompt.cancelText"),
        trapFocus: true,
        onConfirm: (name) => {
          resolve(name);
        },
      });
    });
  }

  showExport(account: AccountEntity): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountExport,
      hasModalCard: true,
      trapFocus: true,
      props: { account },
    });
  }

  showMnemonic(): void {
    this.$buefy.dialog.confirm({
      message: translate("accountList.message.confirmation.showMnemonic"),
      trapFocus: true,
      confirmText: translate("accountList.message.confirmation.confirmText"),
      cancelText: translate("accountList.message.confirmation.cancelText"),
      onConfirm: () => {
        this.$buefy.modal.open({
          parent: this,
          component: MnemonicExport,
          hasModalCard: true,
          trapFocus: true,
          props: { mnemonic: store.state.vault.seedMnemonic },
        });
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
