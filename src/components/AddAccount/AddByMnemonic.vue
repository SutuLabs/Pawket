<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <header class="modal-card-head">
      <p class="modal-card-title">{{ title }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('addByMnemonic.ui.label.name')">
        <b-input
          ref="name"
          v-model="name"
          type="text"
          required
          maxlength="36"
          :validation-message="$t('addByMnemonic.ui.message.nameRequired')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addByMnemonic.ui.label.mnemonic', { len: mnemonicLen })" :type="errorMessage ? 'is-danger' : ''">
        <b-input
          ref="mnemonic"
          v-model="mnemonic"
          type="textarea"
          required
          :validation-message="$t('addByMnemonic.ui.message.mnemonicRequired')"
          @input.native.enter="clearErrorMsg()"
        ></b-input>
      </b-field>
      <p class="help is-danger">
        {{ errorMessage }}
      </p>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('addByMnemonic.ui.button.back')" @click="close()"></b-button>
      <b-button :label="$t('addByMnemonic.ui.button.submit')" type="is-primary" @click="submit()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import account from "@/services/crypto/account";

@Component
export default class AddByMnemonic extends Vue {
  @Prop({ default: 24 }) private mnemonicLen!: number;
  @Prop() public title!: string;
  public name = "";
  public mnemonic = "";
  public errorMessage = "";
  public submitting = false;

  close(): void {
    this.$emit("close");
  }

  clearErrorMsg(): void {
    this.errorMessage = "";
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.mnemonic as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async addAccount(): Promise<void> {
    this.validate();
    if (this.name === "" || this.mnemonic === "") {
      return;
    }
    this.submitting = true;
    this.mnemonic = this.mnemonic.replace(/\s+/g, " ").trim();
    if (this.mnemonic.split(" ").length != this.mnemonicLen) {
      this.errorMessage = this.$tc("addByMnemonic.ui.message.invalidMnemonic");
      return;
    }
    const acc = await account.getAccount("", null, this.mnemonic);
    if (store.state.account.accounts.find((a) => a.key.fingerprint === acc.fingerprint)) {
      this.$buefy.dialog.alert(this.$tc("addByMnemonic.message.error.accountMnemonicExists"));
      return;
    }

    await store.dispatch("createAccountByLegacyMnemonic", { name: this.name, legacyMnemonic: this.mnemonic });
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }
}
</script>
