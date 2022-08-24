<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('accountManagement.ui.title')" :showClose="true" @close="close()"></top-bar>
    <div class="modal-card-body">
      <a v-for="(account, idx) in accounts" :key="idx" class="panel-block" @click="select(idx)">
        <b-icon icon="check" v-if="idx == selectedAccount" style="margin-left: -15px" size="is-small" type="is-primary"></b-icon>
        <figure class="image is-32x32" style="margin: auto">
          <img v-if="account.profilePic" class="is-rounded cover" :src="account.profilePic" />
          <img v-else class="is-rounded" src="@/assets/account-circle.svg" />
        </figure>
        <div class="column is-flex my-0 py-0">
          <div class="py-1">
            <p class="is-size-6">{{ account.name }}</p>
            <p class="is-size-7 has-text-grey">{{ account.key.fingerprint }}</p>
          </div>
        </div>
        <div class="column has-text-centered">
          <b-tag v-if="account.type == 'Password'" rounded class="has-background-grey-lighter">{{
            $t("accountManagement.ui.label.passPhrase")
          }}</b-tag>
          <b-tag v-if="account.type == 'Address'" rounded class="has-background-grey-lighter">{{
            $t("accountManagement.ui.label.address")
          }}</b-tag>
          <b-tag v-if="account.type == 'Legacy'" rounded class="has-background-grey-lighter">{{
            $t("accountManagement.ui.label.imported")
          }}</b-tag>
        </div>
        <div class="column py-1">
          <span @click.stop="showDetail(idx)"
            ><b-icon class="is-pulled-right hover-info has-text-grey" icon="text-box-search-outline"> </b-icon
          ></span>
        </div>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addBySerial()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addBySerial')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addBySerial") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByPassword()" v-if="experimentMode">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByPassword')" position="is-right" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByPassword") }}</span>
        </b-tooltip>
      </a>
      <a v-if="debugMode" href="javascript:void(0)" class="panel-block" @click="addByAddress()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByAddress')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="plus-thick"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByAddress") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByLegacy()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByLegacy')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="import"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByLegacy") }}</span>
        </b-tooltip>
      </a>
      <a href="javascript:void(0)" class="panel-block" @click="addByMnemonic()">
        <b-tooltip :label="$t('accountManagement.ui.tooltip.addByMnemonic')" multilined size="is-small">
          <span class="panel-icon">
            <b-icon icon="import"></b-icon>
          </span>
          <span class="mx-2">{{ $t("accountManagement.ui.button.addByMnemonic") }}</span>
        </b-tooltip>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { AccountEntity } from "@/models/account";
import { Component, Vue } from "vue-property-decorator";
import AccountInfo from "./AccountInfo.vue";
import TopBar from "@/components/Common/TopBar.vue";
import { notifyPrimary } from "@/notification/notification";
import AddByAddress from "./AddAccount/AddByAddress.vue";
import AddByMnemonic from "./AddAccount/AddByMnemonic.vue";
import AddBySerial from "./AddAccount/AddBySerial.vue";
import AddByPassword from "./AddAccount/AddByPassword.vue";
import { isMobile } from "@/services/view/responsive";

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
      component: AccountInfo,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { idx: idx },
      events: { rename: this.rename },
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
        message: this.$tc("accountManagement.message.prompt.setAccountName"),
        confirmText: this.$tc("accountManagement.message.prompt.confirmText"),
        cancelText: this.$tc("accountManagement.message.prompt.cancelText"),
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
    notifyPrimary(this.$tc("accountManagement.message.notification.saved"));
  }

  async addByPassword(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByPassword,
      hasModalCard: true,
      fullScreen: isMobile(),
      canCancel: [""],
      trapFocus: true,
    });
  }

  addBySerial(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddBySerial,
      hasModalCard: true,
      fullScreen: isMobile(),
      canCancel: [""],
      trapFocus: true,
      props: { defaultName: this.$t("accountManagement.ui.value.defaultName", { n: this.accountNum }) },
    });
  }

  async addByLegacy(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { title: this.$t("accountManagement.ui.modal.addByLegacy"), mnemonicLen: 24 },
    });
  }

  async addByMnemonic(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByMnemonic,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { title: this.$t("accountManagement.ui.modal.addByMnemonic"), mnemonicLen: 12 },
    });
  }

  async addByAddress(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: AddByAddress,
      hasModalCard: true,
      fullScreen: isMobile(),
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

.cover {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
</style>
