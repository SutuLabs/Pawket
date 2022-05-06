<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <header class="modal-card-head">
      <p class="modal-card-title">{{ $t("addBySerial.ui.title") }}</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('addBySerial.ui.label.name')">
        <b-input
          ref="name"
          v-model="name"
          type="text"
          required
          maxlength="36"
          :validation-message="$t('addBySerial.ui.message.nameRequired')"
        ></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot is-justify-content-space-between">
      <b-button :label="$t('addBySerial.ui.button.back')" @click="close()"></b-button>
      <b-button :label="$t('addBySerial.ui.button.submit')" type="is-primary" @click="submit()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store/index";

@Component
export default class AddBySerial extends Vue {
  public name = "";
  public submitting = false;

  close(): void {
    this.$emit("close");
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async addAccount(): Promise<void> {
    this.submitting = true;
    this.validate();

    store.dispatch("createAccountBySerial", this.name);
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }
}
</script>
