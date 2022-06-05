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
      <b-field :type="errorMessage ? 'is-danger' : ''">
        <template #label>
          {{ $t("addByMnemonic.ui.label.mnemonic", { len: mnemonicLen }) }}
          <b-tooltip :label="$t('addByMnemonic.ui.tooltip.mnemonic')" position="is-bottom" multilined>
            <b-icon icon="help-circle" size="is-small"> </b-icon>
          </b-tooltip>
        </template>
        <b-input
          ref="mnemonic"
          v-model="address"
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
import puzzle from "@/services/crypto/puzzle";

@Component
export default class AddByAddress extends Vue {
  @Prop({ default: 24 }) private mnemonicLen!: number;
  @Prop() public title!: string;
  public name = "";
  public address = "";
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
    if (this.name === "" || this.address === "") {
      return;
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
