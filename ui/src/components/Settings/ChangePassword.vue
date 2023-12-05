<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("changePassword.ui.title.changePassword") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('changePassword.ui.label.oldPassword')" :type="isCorrect ? '' : 'is-danger'">
        <b-input
          v-model="oldPwd"
          type="password"
          ref="oldPwd"
          required
          :validation-message="$t('changePassword.message.error.passwordRequired')"
        ></b-input>
      </b-field>
      <p class="help is-danger" v-if="!isCorrect">{{ $t("changePassword.message.error.passwordNotCorrect") }}</p>
      <b-field :label="$t('changePassword.ui.label.newPassword')">
        <b-input
          v-model="newPwd"
          type="password"
          ref="newPwd"
          required
          :validation-message="$t('changePassword.message.error.passwordRequired')"
        ></b-input>
      </b-field>
      <b-field :label="$t('changePassword.ui.label.rePassword')" :type="isMatch ? '' : 'is-danger'">
        <b-input
          v-model="rePwd"
          type="password"
          ref="rePwd"
          required
          :validation-message="$t('changePassword.message.error.passwordRequired')"
        ></b-input>
      </b-field>
      <p class="help is-danger" v-if="!isMatch">{{ $t("changePassword.message.error.passwordNotMatch") }}</p>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('changePassword.ui.button.back')" @click="close()"></b-button>
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
import { isPasswordCorrect } from "@/store/modules/vault";

@Component
export default class ChangePassword extends Vue {
  isCorrect = true;
  isProcessing = false;
  isMatch = true;
  oldPwd = "";
  newPwd = "";
  rePwd = "";
  close(): void {
    this.$emit("close");
  }

  validate(): void {
    (this.$refs.oldPwd as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.newPwd as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.rePwd as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async submitChangePassword(): Promise<void> {
    this.validate();
    if (!this.oldPwd.length || !this.newPwd.length || !this.rePwd.length) {
      return;
    }

    this.isCorrect = true;
    this.isProcessing = true;
    this.isMatch = true;

    if (!await isPasswordCorrect(this.oldPwd)) {
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
    await store.dispatch("changePassword", { oldPassword: oldPwd, newPassword: newPwd });
    Dialog.alert(this.$tc("changePassword.message.alert.passwordChanged"));
    this.close();
    store.dispatch("lock");
  }
}
</script>
