<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <top-bar :title="$t('addByPassword.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('addByPassword.ui.label.name')" :type="nameError ? 'is-danger' : ''" :message="nameError">
        <b-input
          ref="name"
          v-model="name"
          type="text"
          required
          maxlength="36"
          :validation-message="$t('addByPassword.ui.message.nameRequired')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addByPassword.ui.label.password')">
        <b-input
          ref="password"
          v-model="password"
          type="password"
          required
          :validation-message="$t('addByPassword.ui.message.passwordRequired')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addByPassword.ui.label.rePassword')" :type="errorMessage ? 'is-danger' : ''">
        <b-input v-model="rePassword" type="password" @input.native.enter="clearErrorMsg()"></b-input>
      </b-field>
      <p class="help is-danger">
        {{ errorMessage }}
      </p>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('addByPassword.ui.button.back')" @click="close()"></b-button>
      <b-button :label="$t('addByPassword.ui.button.submit')" type="is-primary" @click="submit()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import account from "@/services/crypto/account";
import TopBar from "@/components/Common/TopBar.vue";

@Component({ components: { TopBar } })
export default class AddByPassword extends Vue {
  @Prop({ default: 24 }) public mnemonicLen!: number;
  @Prop() public title!: string;
  public name = "";
  public password = "";
  public rePassword = "";
  public errorMessage = "";
  public nameError = "";
  public submitting = false;

  close(): void {
    this.$emit("close");
  }

  clearErrorMsg(): void {
    this.errorMessage = "";
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.password as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async addAccount(): Promise<void> {
    this.validate();
    for (const acc of store.state.account.accounts) {
      if (acc.name === this.name) {
        this.nameError = this.$tc("addByAddress.ui.message.duplicateName");
        return;
      }
    }
    if (this.password !== this.rePassword) {
      this.errorMessage = this.$tc("addByPassword.ui.message.invalidPassword");
      return;
    }
    const acc = await account.getAccount(store.state.vault.seedMnemonic, this.password);
    if (store.state.account.accounts.find((a) => a.key.fingerprint === acc.fingerprint)) {
      this.$buefy.dialog.alert(this.$tc("addByPassword.message.error.accountPasswordExists"));
      return;
    }
    this.submitting = true;
    await store.dispatch("createAccountByPassword", { name: this.name, password: this.password });
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }
}
</script>
