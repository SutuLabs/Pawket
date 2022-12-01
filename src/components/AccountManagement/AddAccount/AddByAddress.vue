<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <top-bar :title="$t('addByAddress.ui.title')" @close="close()" :showClose="true"></top-bar>
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
      <b-field :type="addresserror ? 'is-danger' : ''" :message="addresserror">
        <template #label>
          {{ $t("addByAddress.ui.label.address") }}
        </template>
        <b-input
          ref="address"
          v-model="address"
          type="text"
          required
          :custom-class="isLegalAddress ? '' : 'is-danger'"
          :validation-message="$t('addByAddress.ui.message.addressRequired')"
          @input.native.enter="clearErrorMsg()"
        ></b-input>
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
import puzzle from "@/services/crypto/puzzle";
import { Bytes } from "clvm";
import { bech32m } from "@scure/base";
import TopBar from "@/components/Common/TopBar.vue";

@Component({ components: { TopBar } })
export default class AddByAddress extends Vue {
  @Prop({ default: 24 }) public mnemonicLen!: number;
  @Prop() public title!: string;
  public name = "";
  public address = "";
  public addresserror = "";
  public nameError = "";
  public submitting = false;
  isLegalAddress = true;

  close(): void {
    this.$emit("close");
  }

  clearErrorMsg(): void {
    this.addresserror = "";
    this.isLegalAddress = true;
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
    (this.$refs.address as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async addAccount(): Promise<void> {
    this.validate();
    if (this.name === "" || this.address === "") {
      return;
    }
    try {
      Bytes.from(bech32m.decodeToBytes(this.address).bytes).hex();
    } catch (error) {
      this.isLegalAddress = false;
      this.addresserror = this.$tc("addByAddress.ui.message.illegalAddress");
      return;
    }
    for (const acc of store.state.account.accounts) {
      if (acc.type === "Address" && acc.firstAddress === this.address) {
        this.isLegalAddress = false;
        this.addresserror = this.$tc("addByAddress.ui.message.duplicateAddress");
        return;
      }
      if (acc.name === this.name) {
        this.nameError = this.$tc("addByAddress.ui.message.duplicateName");
        return;
      }
    }
    this.submitting = true;
    var puzzleHash = puzzle.getPuzzleHashFromAddress(this.address);

    await store.dispatch("createAccountByAddress", { name: this.name, puzzleHash });
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }
}
</script>
