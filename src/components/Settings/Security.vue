<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('settings.security.title')" @close="$router.back()"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('settings.security.label.mnemonic')">
        <b-button v-if="!showMnemonic" type="is-primary" icon-left="eye" outlined expanded @click="toggleMnemonic()">
          {{ $t("settings.security.button.showMnemonic") }}</b-button
        >
        <b-button v-else type="is-primary" icon-left="eye-off" outlined expanded @click="toggleMnemonic()">
          {{ $t("settings.security.button.hideMnemonic") }}</b-button
        >
        <div v-if="showMnemonic" class="width-400">
          <br />
          {{ mnemonic }}
          <key-box icon="checkbox-multiple-blank-outline" :tooltip="$t('common.tooltip.copy')" :value="mnemonic"></key-box>
        </div>
      </b-field>
      <b-field :label="$t('settings.security.label.password')">
        <b-button type="is-primary" icon-left="pencil-lock-outline" outlined expanded @click="ChangePassword()">
          {{ $t("settings.security.button.password") }}</b-button
        >
      </b-field>
      <b-field :label="$t('settings.security.label.export')">
        <b-button type="is-primary" icon-left="export" outlined expanded @click="backup()">
          {{ $t("settings.security.button.backup") }}</b-button
        >
      </b-field>
      <b-field :label="$t('settings.security.label.reset')">
        <b-button type="is-danger" expanded outlined @click="reset()">{{ $t("settings.security.button.reset") }}</b-button>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { AccountEntity } from "@/models/account";
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import ChangePassword from "@/components/Settings/ChangePassword.vue";
import TopBar from "@/components/Common/TopBar.vue";
import { isPasswordCorrect } from "@/store/modules/vault";
import { isMobile } from "@/services/view/responsive";
import Backup from "./Backup.vue";

@Component({
  components: {
    KeyBox,
    ChangePassword,
    TopBar,
  },
})
export default class Security extends Vue {
  showMnemonic = false;

  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get mnemonic(): string {
    return store.state.vault.seedMnemonic;
  }

  ChangePassword(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ChangePassword,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { mnemonic: store.state.vault.seedMnemonic },
    });
  }

  backup(): void {
    this.$buefy.dialog.confirm({
      title: this.$tc("settings.security.message.backupConfirmTitle"),
      message: this.$tc("settings.security.message.backupConfirm"),
      confirmText: this.$tc("common.button.confirm"),
      cancelText: this.$tc("common.button.cancel"),
      trapFocus: true,
      type: "is-info",
      hasIcon: true,
      onConfirm: () => {
        this.$buefy.modal.open({
          parent: this,
          component: Backup,
          hasModalCard: true,
          trapFocus: true,
          canCancel: [""],
          fullScreen: isMobile(),
          props: { mnemonic: store.state.vault.seedMnemonic },
        });
      },
    });
  }

  reset(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("settings.security.message.clear"),
      confirmText: this.$tc("common.button.confirm"),
      cancelText: this.$tc("common.button.cancel"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: async () => {
        await store.dispatch("clear").then(() => location.reload());
      },
    });
  }

  async toggleMnemonic(): Promise<void> {
    if (this.showMnemonic) {
      this.showMnemonic = false;
      return;
    }
    this.$buefy.dialog.prompt({
      message: this.$tc("settings.security.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("common.button.cancel"),
      confirmText: this.$tc("common.button.confirm"),
      onConfirm: async (password, { close }) => {
        if (!(await isPasswordCorrect(password))) {
          this.$buefy.toast.open({
            message: this.$tc("settings.security.message.passwordNotCorrect"),
            type: "is-danger",
          });
          return;
        }
        close();
        this.showMnemonic = true;
      },
    });
  }
}
</script>

<style scoped lang="scss">
.width-400 {
  max-width: 400px;
}
</style>
