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
      <address-field
        :inputAddress="address"
        :validAddress="isLegalAddress"
        @updateAddress="updateAddress"
        :showAddressBook="false"
      ></address-field>
      <p v-if="addresserror" class="has-text-danger">
        {{ addresserror }}
      </p>
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
import puzzle from "../../../../../lib-chia/services/crypto/puzzle";
import { Bytes } from "clvm";
import { bech32m } from "@scure/base";
import TopBar from "@/components/Common/TopBar.vue";
import AddressField from "@/components/Common/AddressField.vue";

@Component({
  components: {
    TopBar,
    AddressField,
  },
})
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

  updateAddress(value: string): void {
    this.address = value;
    this.clearErrorMsg();
  }

  clearErrorMsg(): void {
    this.addresserror = "";
    this.isLegalAddress = true;
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
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
        this.addresserror = this.$tc("addByAddress.ui.message.duplicateAddress", undefined, { accName: acc.name });
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
