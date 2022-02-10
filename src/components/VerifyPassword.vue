<template>
  <div class="box">
    <section v-if="mode == 'Verify'">
      <b-field :label="$t('verifyPassword.ui.label.password')" label-position="on-border">
        <b-input type="password" @keyup.native.enter="confirm()" v-model="password"></b-input>
      </b-field>
      <b-button @click="confirm()">{{ $t("verifyPassword.ui.button.confirm") }}</b-button>
      <b-button v-if="showClear" type="is-danger" @click="clear()">{{ $t("verifyPassword.ui.button.clear") }}</b-button>
    </section>

    <section v-if="mode == 'Create'">
      <b-field :label="$t('verifyPassword.ui.label.password')" label-position="on-border">
        <b-input type="password" v-model="password"></b-input>
      </b-field>
      <b-field :label="$t('verifyPassword.ui.label.reEnter')" label-position="on-border">
        <b-input type="password" @keyup.native.enter="create()" v-model="repassword"></b-input>
      </b-field>
      <b-button @click="create()">{{ $t("verifyPassword.ui.button.create") }}</b-button>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import utility from "@/services/crypto/utility";
import { translate } from "@/i18n/i18n";

type Mode = "Verify" | "Create";

@Component
export default class VerifyPassword extends Vue {
  public password = "";
  public repassword = "";
  public mode: Mode = "Verify";
  public showClear = false;

  mounted(): void {
    this.mode = store.state.vault.passwordHash ? "Verify" : "Create";
  }

  async confirm(): Promise<void> {
    const pswhash = await utility.hash(this.password);
    if (pswhash != store.state.vault.passwordHash) {
      this.showClear = true;
      return;
    }
    await store.dispatch("unlock", this.password);
  }

  create(): void {
    if (this.repassword != this.password) return;
    store.dispatch("setPassword", this.password);
  }

  clear(): void {
    this.$buefy.dialog.confirm({
      message: translate("verifyPassword.message.confirmation.clear"),
      confirmText: translate("verifyPassword.message.confirmation.confirmText"),
      cancelText: translate("verifyPassword.message.confirmation.cancelText"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        store.dispatch("clear");
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
