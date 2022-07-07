<template>
  <div class="modal-card margin-auto">
    <div class="modal-card-body">
      <top-bar :title="$t('accountManagement.title')" :showClose="true" @close="close()"></top-bar>
      <a v-for="(account, idx) in accounts" :key="idx" class="panel-block" @click="select(idx)">
        <b-icon icon="check" v-if="idx == selectedAccount" style="margin-left: -15px" size="is-small" type="is-primary"></b-icon>
        <b-icon icon="account" class="has-text-grey"></b-icon>
        <div class="column is-flex my-0 py-0">
          <div class="py-1">
            <p class="is-size-6">{{ account.name }}</p>
            <p class="is-size-7 has-text-grey">{{ account.key.fingerprint }}</p>
          </div>
        </div>
        <div class="column has-text-centered">
          <b-tag v-if="account.type == 'Password'" rounded class="has-background-grey-lighter">{{
            $t("accountManagement.label.passPhrase")
          }}</b-tag>
          <b-tag v-if="account.type == 'Address'" rounded class="has-background-grey-lighter">{{
            $t("accountManagement.label.address")
          }}</b-tag>
          <b-tag v-if="account.type == 'Legacy'" rounded class="has-background-grey-lighter">{{
            $t("accountManagement.label.imported")
          }}</b-tag>
        </div>
        <div class="column py-1">
          <span @click.stop="showDetail(idx)"><b-icon class="is-pulled-right hover-info has-text-grey" icon="dots-vertical"> </b-icon></span>
          <span v-if="idx != 0" @click.stop="remove(idx)"
            ><b-icon class="is-pulled-right pr-2 hover-danger has-text-grey" icon="delete-outline"> </b-icon
          ></span>
        </div>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addBySerial')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addBySerial") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()" v-if="experimentMode">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByPassword')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByPassword") }}</span>
        </b-tooltip>
      </a>
      <a v-if="debugMode" href="javascript:void(0)" class="panel-block" @click="addByAddress()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByAddress')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByAddress") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByLegacy()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByLegacy')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="import"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByLegacy") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByMnemonic()">
        <b-tooltip :label="$t('accountList.ui.tooltip.addByMnemonic')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="import"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountList.ui.button.addByMnemonic") }}</span>
        </b-tooltip>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { AccountEntity } from "@/store/modules/account";
import { Component, Vue } from "vue-property-decorator";
import AccountDetail from "./AccountDetail.vue";
import TopBar from "../TopBar.vue";
import { notifyPrimary } from "@/notification/notification";
import AddByAddress from "../AddAccount/AddByAddress.vue";
import AddByMnemonic from "../AddAccount/AddByMnemonic.vue";
import AddBySerial from "../AddAccount/AddBySerial.vue";
import AddByPassword from "../AddAccount/AddByPassword.vue";

@Component({
  components: { TopBar },
})
export default class AccountManagement extends Vue {
  get accounts(): AccountEntity[] {
    return store.state.account.accounts;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get isMobile(): boolean {
    return window.screen.width < 700;
  }

  get accountNum(): string {
    const n = this.accounts.filter((a) => a.type === "Serial").length;
    return (n + 1).toString();
  }

  close(): void {
    this.$emit("close");
  }

  showDetail(idx: number): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountDetail,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: this.isMobile,
      props: { idx: idx },
      events: { rename: this.rename },
    });
  }

  lock(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("accountDetail.message.confirmation.lock"),
      confirmText: this.$tc("accountDetail.ui.button.confirm"),
      cancelText: this.$tc("accountDetail.ui.button.cancel"),
      trapFocus: true,
      onConfirm: () => {
        store.dispatch("lock");
      },
    });
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

  select(idx: number): void {
    store.state.account.selectedAccount = idx;
    store.dispatch("refreshBalance");
    store.dispatch("selectAccount", idx);
    this.close();
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
      fullScreen: this.isMobile,
      canCancel: [""],
      trapFocus: true,
    });
  }

  addBySerial(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddBySerial,
      hasModalCard: true,
      fullScreen: this.isMobile,
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
      fullScreen: this.isMobile,
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
      fullScreen: this.isMobile,
      canCancel: [""],
      props: { title: this.$t("accountList.ui.modal.addByMnemonic"), mnemonicLen: 12 },
    });
  }

  async addByAddress(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByAddress,
      hasModalCard: true,
      fullScreen: this.isMobile,
      trapFocus: true,
      canCancel: [""],
    });
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

.border-bottom {
  border-bottom: 2px solid #ededed;
}

.margin-auto {
  margin: auto !important;
}

.hover-danger:hover {
  color: $danger !important;
}

.hover-info:hover {
  color: $info !important;
}
</style>
