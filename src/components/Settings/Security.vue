<template>
  <div class="modal-card m-0">
    <top-bar :title="$t('settings.security.title')" @close="$emit('close')"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('settings.security.label.mnemonic')">
        <b-button v-if="!showMnemonic" type="is-primary" icon-left="eye" outlined expanded @click="toggleMnemonic()">
          {{ $t("settings.security.button.showMnemonic") }}</b-button
        >
         <b-button v-else type="is-primary" icon-left="eye-off" outlined expanded @click="toggleMnemonic()">
          {{ $t("settings.security.button.hideMnemonic") }}</b-button
        >
        <span v-if="showMnemonic">
          <br />
          {{ account.key.compatibleMnemonic }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('accountExport.ui.tooltip.copy')"
            :value="account.key.compatibleMnemonic"
          ></key-box>
        </span>
      </b-field>
      <b-field :label="$t('settings.security.label.password')">
        <b-button type="is-primary" icon-left="pencil-lock-outline" outlined expanded @click="ChangePassword()">
          {{ $t("settings.security.button.password") }}</b-button
        >
      </b-field>
      <b-field :label="$t('settings.security.label.export')">
        <b-button icon-left="export" outlined expanded disabled> {{ $t("settings.security.button.export") }}</b-button>
      </b-field>
      <b-field :label="$t('settings.security.label.reset')">
        <b-button type="is-danger" expanded outlined @click="reset()">{{ $t("settings.security.button.reset") }}</b-button>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import store from "@/store";
import { AccountEntity } from "@/store/modules/account";
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import ChangePassword from "../ChangePassword.vue";
import TopBar from "../TopBar.vue";
import { isPasswordCorrect } from "@/store/modules/vault";

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

  get isMobile(): boolean {
    return window.screen.width < 700;
  }

  ChangePassword(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ChangePassword,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: this.isMobile,
      props: { mnemonic: store.state.vault.seedMnemonic },
    });
  }

  reset(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("verifyPassword.message.confirmation.clear"),
      confirmText: this.$tc("verifyPassword.message.confirmation.confirmText"),
      cancelText: this.$tc("verifyPassword.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("clear");
      },
    });
  }

  async toggleMnemonic(): Promise<void> {
    if (this.showMnemonic) {
      this.showMnemonic = false;
      return;
    }
    this.$buefy.dialog.prompt({
      message: this.$tc("accountExport.message.inputPassword"),
      inputAttrs: {
        type: "password",
      },
      trapFocus: true,
      closeOnConfirm: false,
      canCancel: ["button"],
      cancelText: this.$tc("accountConfigure.ui.button.cancel"),
      confirmText: this.$tc("accountConfigure.ui.button.confirm"),
      onConfirm: async (password, { close }) => {
        if (!(await isPasswordCorrect(password))) {
          this.$buefy.toast.open({
            message: this.$tc("accountConfigure.message.error.passwordNotCorrect"),
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

<style scoped lang="scss"></style>
