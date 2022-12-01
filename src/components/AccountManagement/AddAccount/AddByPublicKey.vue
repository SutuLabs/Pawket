<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <top-bar :title="$t('addByPublicKey.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('addByAddress.ui.label.name')" :type="nameError ? 'is-danger' : ''" :message="nameError">
        <b-input
          ref="name"
          v-model="name"
          type="text"
          required
          maxlength="36"
          :validation-message="$t('addByAddress.ui.message.nameRequired')"
        ></b-input>
      </b-field>
      <b-field :type="errorMessage ? 'is-danger' : ''" :message="errorMessage">
        <template #label>
          {{ $t("addByAddress.ui.label.publicKey") }}
        </template>
        <b-input
          ref="publicKey"
          v-model="publicKey"
          type="text"
          required
          expanded
          :custom-class="isLegalAddress ? '' : 'is-danger'"
          :validation-message="$t('addByPublicKey.ui.message.publicKeyRequired')"
          @input.native.enter="clearErrorMsg()"
        ></b-input>
        <p class="control">
          <b-button @click="scanQrCode()">
            <b-icon icon="scan-helper"></b-icon>
          </b-button>
        </p>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('addByAddress.ui.button.back')" @click="close()"></b-button>
      <b-button :label="$t('addByAddress.ui.button.submit')" type="is-primary" @click="submit()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import TopBar from "@/components/Common/TopBar.vue";
import { prefix0x } from "@/services/coin/condition";

@Component({ components: { TopBar } })
export default class AddByPublicKey extends Vue {
  @Prop({ default: 24 }) public mnemonicLen!: number;
  @Prop() public title!: string;
  public name = "";
  public publicKey = "";
  public errorMessage = "";
  public nameError = "";
  public submitting = false;
  isLegalAddress = true;

  close(): void {
    this.$emit("close");
  }

  clearErrorMsg(): void {
    this.errorMessage = "";
    this.isLegalAddress = true;
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.publicKey as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async addAccount(): Promise<void> {
    this.validate();
    if (this.name === "" || this.publicKey === "") {
      return;
    }

    for (const acc of store.state.account.accounts) {
      if (acc.type === "PublicKey" && acc.key.publicKey === prefix0x(this.publicKey)) {
        this.isLegalAddress = false;
        this.errorMessage = this.$tc("addByAddress.ui.message.duplicatePublicKey");
        return;
      }
      if (acc.name === this.name) {
        this.nameError = this.$tc("addByAddress.ui.message.duplicateName");
        return;
      }
    }
    this.submitting = true;

    await store.dispatch("createAccountByPublicKey", { name: this.name, publicKey: prefix0x(this.publicKey) });
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }

  async scanQrCode(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Common/ScanQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.publicKey = value;
        },
      },
    });
  }
}
</script>
