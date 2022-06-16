<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("accountList.ui.title.list") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <a class="panel-block" v-for="(account, idx) in accounts" :key="idx" @click="select(idx)">
        <span class="panel-icon">
          <b-icon icon="account" class="has-text-gray"></b-icon>
        </span>
        <span class="mx-2">{{ account.name | nameOmit }}: {{ account.key.fingerprint }} [{{ account.type }}]</span>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.edit')">
          <span @click.stop="rename(idx)">
            <b-icon icon="square-edit-outline" class="has-text-grey hover-primary mr-1"></b-icon
          ></span>
        </b-tooltip>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.details')">
          <span @click.stop="showExport(account)"
            ><b-icon icon="text-box-search-outline" class="has-text-grey hover-primary mr-1"></b-icon
          ></span>
        </b-tooltip>
        <b-tooltip position="is-bottom" :label="$t('accountList.ui.tooltip.delete')">
          <span @click.stop="remove(idx)" v-if="idx > 0"
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
      <a v-if="debugMode" href="javascript:void(0)" class="panel-block" @click="addByAddress()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByAddress')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick" class="has-text-grey"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByAddress") }}</span>
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
import AddByMnemonic from "./AddAccount/AddByMnemonic.vue";
import AddByPassword from "./AddAccount/AddByPassword.vue";
import { nameOmit } from "@/filters/nameConversion";
import AddBySerial from "@/components/AddAccount/AddBySerial.vue";
import { notifyPrimary } from "@/notification/notification";
import AddByAddress from "./AddAccount/AddByAddress.vue";

@Component({
  filters: { nameOmit },
})
export default class AccountList extends Vue {
  @Prop() private account!: AccountEntity;

  get accounts(): AccountEntity[] {
    return store.state.account.accounts;
  }

  get accountNum(): string {
    const n = this.accounts.filter((a) => a.type === "Serial").length;
    return (n + 1).toString();
  }

  get accountIndex(): number {
    return store.state.account.selectedAccount;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  @Emit("close")
  close(): void {
    return;
  }

  select(idx: number): void {
    store.state.account.selectedAccount = idx;
    store.dispatch("refreshBalance");
    store.dispatch("selectAccount", idx);
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
    const name = await this.getAccountName(idx);
    store.dispatch("renameAccount", { idx, name });
    notifyPrimary(this.$tc("accountList.message.notification.saved"));
  }

  async addByPassword(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByPassword,
      hasModalCard: true,
      canCancel: [""],
      trapFocus: true,
    });
  }

  addBySerial(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddBySerial,
      hasModalCard: true,
      canCancel: [""],
      trapFocus: true,
      props: { defaultName: this.$t("accountList.ui.value.defaultName", { n: this.accountNum }) },
    });
  }

  async addByLegacy(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { title: this.$t("accountList.ui.modal.addByLegacy"), mnemonicLen: 24 },
    });
  }

  async addByMnemonic(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { title: this.$t("accountList.ui.modal.addByMnemonic"), mnemonicLen: 12 },
    });
  }

  async addByAddress(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByAddress,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
    });
  }

  getAccountName(idx: number): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise((resolve, reject) => {
      this.$buefy.dialog.prompt({
        message: this.$tc("accountList.message.prompt.setAccountName"),
        confirmText: this.$tc("accountList.message.prompt.confirmText"),
        cancelText: this.$tc("accountList.message.prompt.cancelText"),
        inputAttrs: {
          maxlength: 36,
          value: this.accounts[idx].name,
        },
        canCancel: ["button"],
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
      canCancel: [""],
      props: { account },
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
