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
      <div v-for="(publicKey, index) in publicKeys" :key="index">
        <b-field :type="errorMessages[index] ? 'is-danger' : ''">
          <template #label> {{ $t("addByAddress.ui.label.publicKey") }} {{ index + 1 }} </template>
          <template #message>
            {{ errorMessages[index] }}
            <span>
              <span v-if="!resolveAnswers[index]"></span>
              <span v-else-if="resolveAnswers[index].status == 'Failure'">
                <b-icon type="is-warning" icon="alert-decagram-outline" size="is-small"></b-icon>
                {{ $t("addressField.ui.resolve.fail") }}
              </span>
              <span v-else-if="resolveAnswers[index].status == 'NotFound'">
                <b-icon type="is-danger" icon="alert-decagram" size="is-small"></b-icon>
                {{ $t("addressField.ui.resolve.notFound") }}
              </span>
              <span v-else-if="resolveAnswers[index].status == 'Found'" class="is-flex">
                <div class="ml-4">
                  <p class="mb-2">
                    <b-tag type="is-info is-light">{{ publicKey }}</b-tag>
                  </p>
                  <p class="mb-2">
                    {{ $t("addByAddress.ui.label.publicKey") }}
                    <key-box
                      icon="checkbox-multiple-blank-outline"
                      :value="resolvedPublicKeys[index]"
                      :showValue="true"
                    ></key-box>
                  </p>
                </div>
              </span>
            </span>
          </template>
          <b-input
            ref="publicKey"
            v-model="publicKeys[index]"
            type="text"
            required
            expanded
            :loading="loading"
            @input="reset(index)"
            :custom-class="isLegalAddresses[index] ? '' : 'is-danger'"
            :validation-message="$t('addByPublicKey.ui.message.publicKeyRequired')"
          ></b-input>
          <p class="control">
            <b-button @click="scanQrCode(index)">
              <b-icon icon="scan-helper"></b-icon>
            </b-button>
          </p>
        </b-field>
      </div>
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
import { prefix0x } from "../../../../../lib-chia/services/coin/condition";
import KeyBox from "@/components/Common/KeyBox.vue";
import { ResolveFailureAnswer, resolveName, StandardResolveAnswer } from "@/services/api/resolveName";

@Component({ components: { TopBar, KeyBox } })
export default class AddByMpcKeys extends Vue {
  @Prop({ default: 24 }) public mnemonicLen!: number;
  @Prop() public title!: string;
  @Prop() public inputPubKey!: string;
  public name = "";
  public publicKeys: string[] = ["", ""];
  public errorMessages: string[] = ["", ""];
  public nameError = "";
  public submitting = false;
  public isLegalAddresses: boolean[] = [true, true];
  public loading = false;
  public resolveAnswers: (StandardResolveAnswer | ResolveFailureAnswer | null)[] = [null, null];

  close(): void {
    this.$emit("close");
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.publicKey as Array<Vue>).forEach((_) => {
      (_ as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    });
  }

  async reset(index: number): Promise<void> {
    if (this.publicKeys[index].match(/[a-zA-Z0-9-]{4,}\.xch$/)) {
      this.loading = true;
      this.resolveAnswers[index] = await resolveName(this.publicKeys[index], "publicKey");
      this.loading = false;
    } else {
      this.errorMessages[index] = "";
      this.isLegalAddresses[index] = true;
      this.resolveAnswers[index] = null;
    }
  }

  get resolvedPublicKeys(): string[] {
    return this.resolveAnswers.map((answer) => {
      if (answer?.status == "Found" && answer.data) return answer.data;
      return "";
    });
  }

  async addAccount(): Promise<void> {
    this.validate();
    if (this.name === "" || this.publicKeys.some((key) => key === "")) {
      return;
    }

    let publicKeys = this.publicKeys.map((key, index) => {
      if (this.resolvedPublicKeys[index]) return this.resolvedPublicKeys[index];
      return prefix0x(key);
    });

    for (const acc of store.state.account.accounts) {
      if (acc.type === "2-2Keys" && publicKeys.some((key) => acc.key.publicKey === prefix0x(key))) {
        const index = publicKeys.findIndex((key) => acc.key.publicKey === prefix0x(key));
        this.isLegalAddresses[index] = false;
        this.errorMessages[index] = this.$tc("addByAddress.ui.message.duplicatePublicKey", undefined, { accName: acc.name });
        return;
      }
      if (acc.name === this.name) {
        this.nameError = this.$tc("addByAddress.ui.message.duplicateName");
        return;
      }
    }
    this.submitting = true;

    await store.dispatch("createAccountByMpcKeys", { name: this.name, publicKeys: publicKeys });
    this.$emit("added");
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }

  async scanQrCode(index: number): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Common/ScanQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.$set(this.publicKeys, index, value);
        },
      },
    });
  }

  mounted(): void {
    if (this.inputPubKey) this.publicKeys[0] = this.inputPubKey;
  }
}
</script>
