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
          <b-icon icon="account" class="has-text-gray"></b-icon>
        </span>
        <span @click="select(idx)" class="mx-2">{{ account.name }}: {{ account.key.fingerprint }} [{{ account.type }}]</span>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.edit')">
          <span @click="rename(idx)"> <b-icon icon="square-edit-outline" class="has-text-grey hover-primary mr-1"></b-icon></span>
        </b-tooltip>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.details')">
          <span @click="showExport(account)"
            ><b-icon icon="text-box-search-outline" class="has-text-grey hover-primary mr-1"></b-icon
          ></span>
        </b-tooltip>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.delete')">
          <span @click="remove(idx)" v-if="idx > 0"
            ><b-icon icon="trash-can-outline" class="has-text-grey hover-danger"></b-icon
          ></span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addBySerial')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick" class="has-text-grey"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addBySerial") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()" v-if="experimentMode">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByPassword')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick" class="has-text-grey"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByPassword") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByLegacy()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByLegacy')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick" class="has-text-grey"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByLegacy") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByMnemonic()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByMnemonic')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick" class="has-text-grey"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByMnemonic") }}</span>
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
import utility from "@/services/crypto/utility";
import AddByMnemonic from "./AddAccount/AddByMnemonic.vue";
import AddByPassword from "./AddAccount/AddByPassword.vue";

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
    this.$buefy.modal.open({
      parent: this,
      component: AddByPassword,
      hasModalCard: true,
      trapFocus: true,
    });
  }

  addBySerial(): void {
    this.getAccountName().then((name) => {
      store.dispatch("createAccountBySerial", name);
    });
  }

  async addByLegacy(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      props: { title: this.$t("accountList.ui.modal.addByLegacy"), mnemonicLen: 24 },
    });
  }

  async addByMnemonic(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      props: { title: this.$t("accountList.ui.modal.addByMnemonic"), mnemonicLen: 12 },
    });
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

<style scoped lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/derived-variables";

.hover-primary {
  &:hover {
    color: $primary !important;
  }
}

.hover-danger {
  &:hover {
    color: $danger !important;
  }
}
</style>
