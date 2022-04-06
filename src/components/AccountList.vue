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
        <span class="panel-icon">
          <b-icon icon="account" size="is-small"></b-icon>
        </span>
        <span @click="select(idx)">{{ account.name }}: {{ account.key.fingerprint }} [{{ account.type }}]</span>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.delete')">
          <span class="is-pulled-right" @click="remove(idx)" v-if="idx > 0"><b-icon icon="delete" size="is-small"></b-icon></span>
        </b-tooltip>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.edit')">
          <span class="is-pulled-right" @click="rename(idx)"> <b-icon icon="account-edit" size="is-small"></b-icon></span>
        </b-tooltip>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.details')">
          <span class="is-pulled-right" @click="showExport(account)"
            ><b-icon icon="text-box-search" size="is-small"></b-icon
          ></span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addBySerial')" position="is-right" multilined size="is-small">
          <span class="panel-icon">➕</span>
          {{ $t("accountList.ui.button.addBySerial") }}
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()" v-if="experimentMode">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByPassword')" position="is-right" multilined size="is-small">
          <span class="panel-icon">➕</span>
          {{ $t("accountList.ui.button.addByPassword") }}
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByLegacy()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByLegacy')" multilined size="is-small">
          <span class="panel-icon">➕</span>
          {{ $t("accountList.ui.button.addByLegacy") }}
        </b-tooltip>
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
import account from "@/services/crypto/account";
import utility from "@/services/crypto/utility";

@Component
export default class AccountList extends Vue {
  @Prop() private account!: AccountEntity;

  get accounts(): AccountEntity[] {
    return store.state.account.accounts;
  }

  get accountIndex(): number {
    return store.state.account.selectedAccount;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  @Emit("close")
  close(): void {
    return;
  }

  select(idx: number): void {
    store.state.account.selectedAccount = idx;
    store.dispatch("refreshBalance");
    this.close();
  }

  remove(idx: number): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("accountList.message.confirmation.removeAccount"),
      confirmText: this.$tc("accountList.message.confirmation.confirmText"),
      cancelText: this.$tc("accountList.message.confirmation.cancelText"),
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
    const acc = await account.getAccount(store.state.vault.seedMnemonic, password);
    if (store.state.account.accounts.find((a) => a.key.fingerprint === acc.fingerprint)) {
      this.$buefy.dialog.alert(this.$tc("accountList.message.error.accountPasswordExists"));
      return;
    }

    await store.dispatch("createAccountByPassword", { name, password });
  }

  addBySerial(): void {
    this.getAccountName().then((name) => {
      store.dispatch("createAccountBySerial", name);
    });
  }

  async addByLegacy(): Promise<void> {
    const name = await this.getAccountName();
    const legacyMnemonic = await this.getLegacyMnemonic();
    if (legacyMnemonic.trim().split(" ").length != 24) {
      this.$buefy.dialog.alert(this.$tc("accountList.message.error.invalidMnemonic"));
      return;
    }
    const acc = await account.getAccount("", null, legacyMnemonic);
    if (store.state.account.accounts.find((a) => a.key.fingerprint === acc.fingerprint)) {
      this.$buefy.dialog.alert(this.$tc("accountList.message.error.accountMnemonicExists"));
      return;
    }

    await store.dispatch("createAccountByLegacyMnemonic", { name, legacyMnemonic });
  }

  getAccountName(): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: this.$tc("accountList.message.prompt.setAccountName"),
        confirmText: this.$tc("accountList.message.prompt.confirmText"),
        cancelText: this.$tc("accountList.message.prompt.cancelText"),
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
        message: this.$tc("accountList.message.prompt.setPassword"),
        confirmText: this.$tc("accountList.message.prompt.confirmText"),
        cancelText: this.$tc("accountList.message.prompt.cancelText"),
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
        message: this.$tc("accountList.message.prompt.setLegacyMnemonic"),
        confirmText: this.$tc("accountList.message.prompt.confirmText"),
        cancelText: this.$tc("accountList.message.prompt.cancelText"),
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
    this.$buefy.dialog.prompt({
      message: this.$tc("accountExport.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("accountExport.ui.button.cancel"),
      confirmText: this.$tc("accountExport.ui.button.confirm"),
      onConfirm: async (password, { close }) => {
        const pswhash = await utility.hash(password);
        if (pswhash != store.state.vault.passwordHash) {
          this.$buefy.toast.open({
            message: this.$tc("accountExport.message.passwordNotCorrect"),
            type: "is-danger",
          });
          return;
        }
        close();
        this.$buefy.modal.open({
          parent: this,
          component: MnemonicExport,
          hasModalCard: true,
          trapFocus: true,
          canCancel: ["x"],
          props: { mnemonic: store.state.vault.seedMnemonic },
        });
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
