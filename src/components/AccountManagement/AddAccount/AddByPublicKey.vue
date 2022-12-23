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
      <b-field :type="errorMessage ? 'is-danger' : ''">
        <template #label>
          {{ $t("addByAddress.ui.label.publicKey") }}
        </template>
        <template #message>
          {{ errorMessage }}
          <span>
            <span v-if="!resolveAnswer"></span>
            <span v-else-if="resolveAnswer.status == 'Failure'">
              <b-icon type="is-warning" icon="alert-decagram-outline" size="is-small"></b-icon>
              {{ $t("addressField.ui.resolve.fail") }}
            </span>
            <span v-else-if="resolveAnswer.status == 'NotFound'">
              <b-icon type="is-danger" icon="alert-decagram" size="is-small"></b-icon>
              {{ $t("addressField.ui.resolve.notFound") }}
            </span>
            <span v-else-if="resolveAnswer.status == 'Found'" class="is-flex">
              <div class="ml-4">
                <p class="mb-2">
                  <b-tag type="is-info is-light">{{ publicKey }}</b-tag>
                </p>
                <p class="mb-2">
                  {{ $t("addByAddress.ui.label.publicKey") }}
                  <key-box icon="checkbox-multiple-blank-outline" :value="resolvedPublicKey" :showValue="true"></key-box>
                </p>
              </div>
            </span>
          </span>
        </template>
        <b-input
          ref="publicKey"
          v-model="publicKey"
          type="text"
          required
          expanded
          :loading="loading"
          @input="reset()"
          :custom-class="isLegalAddress ? '' : 'is-danger'"
          :validation-message="$t('addByPublicKey.ui.message.publicKeyRequired')"
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
import {
  ResolveFailureAnswer,
  resolveName,
  StandardResolveAnswer,
} from "@/components/Common/AddressField.vue";
import KeyBox from "@/components/Common/KeyBox.vue";

@Component({ components: { TopBar, KeyBox } })
export default class AddByPublicKey extends Vue {
  @Prop({ default: 24 }) public mnemonicLen!: number;
  @Prop() public title!: string;
  @Prop() public inputPubKey!: string;
  public name = "";
  public publicKey = "";
  public errorMessage = "";
  public nameError = "";
  public submitting = false;
  public isLegalAddress = true;
  public loading = false;
  public resolveAnswer: StandardResolveAnswer | ResolveFailureAnswer | null = null;

  close(): void {
    this.$emit("close");
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.publicKey as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async reset(): Promise<void> {
    if (this.publicKey.match(/[a-zA-Z0-9-]{4,}\.xch$/)) {
      this.loading = true;
      this.resolveAnswer = await resolveName(this.publicKey, "publicKey");
      this.loading = false;
    } else {
      this.errorMessage = "";
      this.isLegalAddress = true;
      this.resolveAnswer = null;
    }
  }

  get resolvedPublicKey(): string {
    if (this.resolveAnswer?.status == "Found" && this.resolveAnswer.data) return this.resolveAnswer.data;
    return "";
  }

  async addAccount(): Promise<void> {
    this.validate();
    if (this.name === "" || this.publicKey === "") {
      return;
    }

    let publicKey = this.publicKey;
    if (this.resolvedPublicKey) publicKey = this.resolvedPublicKey;
    for (const acc of store.state.account.accounts) {
      if (acc.type === "PublicKey" && acc.key.publicKey === prefix0x(publicKey)) {
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

    await store.dispatch("createAccountByPublicKey", { name: this.name, publicKey: prefix0x(publicKey) });
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

  mounted(): void {
    if (this.inputPubKey) this.publicKey = this.inputPubKey;
  }
}
</script>
