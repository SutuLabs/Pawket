<template>
  <div class="modal-card">
    <top-bar :title="$t('settings.security.title')" @close="$emit('close')"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('settings.security.label.mnemonic')">
        <b-button type="is-primary" icon-left="eye" outlined expanded @click="showMnemonic = !showMnemonic">
          {{ $t("settings.security.button.mnemonic") }}</b-button
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
        <b-button type="is-primary" icon-left="export" outlined expanded> {{ $t("settings.security.button.export") }}</b-button>
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

  ChangePassword(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ChangePassword,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: true,
      props: { mnemonic: store.state.vault.seedMnemonic },
    });
  }
}
</script>

<style scoped lang="scss">
</style>
