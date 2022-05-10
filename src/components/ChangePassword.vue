<template>
  <div>
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("changePassword.ui.title.changePassword") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('changePassword.ui.label.oldPassword')" :type="isCorrect ? '' : 'is-danger'">
        <b-input v-model="oldPwd" type="password"></b-input>
      </b-field>
      <p class="help is-danger" v-if="!isCorrect">{{ $t("changePassword.message.error.passwordNotCorrect") }}</p>
      <b-field :label="$t('changePassword.ui.label.newPassword')">
        <b-input v-model="newPwd" type="password"></b-input>
      </b-field>
      <b-field :label="$t('changePassword.ui.label.rePassword')" :type="isMatch ? '' : 'is-danger'">
        <b-input v-model="rePwd" type="password"></b-input>
      </b-field>
      <p class="help is-danger" v-if="!isMatch">{{ $t("changePassword.message.error.passwordNotMatch") }}</p>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('changePassword.ui.button.back')" @click="back()"></b-button>
      <b-button
        :label="$t('changePassword.ui.button.submitChange')"
        :loading="isProcessing"
        type="is-primary"
        @click="submitChangePassword()"
      ></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { DialogProgrammatic as Dialog } from "buefy";
import store from "@/store/index";
import utility from "@/services/crypto/utility";

@Component
export default class ChangePassword extends Vue {
  isCorrect = true;
  isProcessing = false;
  isMatch = true;
  oldPwd = "";
  newPwd = "";
  rePwd = "";
  close(): void {
    this.$emit("back")
  }

  back(): void {
    this.$emit("back")
  }

  async submitChangePassword(): Promise<void> {
    this.isCorrect = true;
    this.isMatch = true;
    this.isProcessing = true;

    const pswhash = await utility.hash(this.oldPwd);
    if (pswhash != store.state.vault.passwordHash) {
      this.isCorrect = false;
      this.isProcessing = false;
      return;
    }
    if (this.newPwd != this.rePwd) {
      this.isMatch = false;
      this.isProcessing = false;
      return;
    }
    const oldPwd = this.oldPwd;
    const newPwd = this.newPwd;
    await store.dispatch("changePassword", {oldPassword: oldPwd, newPassword: newPwd});
    Dialog.alert(this.$tc("changePassword.message.alert.passwordChanged"));
    this.close();
    store.dispatch("lock");
  }
}
</script>
