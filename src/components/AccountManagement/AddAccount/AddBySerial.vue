<template>
  <div class="modal-card">
    <b-loading :is-full-page="true" v-model="submitting"></b-loading>
    <top-bar :title="$t('addBySerial.ui.title')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('addBySerial.ui.label.name')" :type="nameError ? 'is-danger' : ''" :message="nameError">
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
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store/index";
import TopBar from "@/components/Common/TopBar.vue";

@Component({ components: { TopBar } })
export default class AddBySerial extends Vue {
  @Prop({ default: "" }) public defaultName!: string;
  public name = "";
  public nameError = "";
  public submitting = false;

  mounted(): void {
    this.name = this.defaultName;
    const accNameInput = this.$refs.name as HTMLInputElement | undefined;
    if (accNameInput) {
      accNameInput.focus();
    }
  }

  close(): void {
    this.$emit("close");
  }

  validate(): void {
    (this.$refs.name as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity();
  }

  async addAccount(): Promise<void> {
    this.validate();
    for (const acc of store.state.account.accounts) {
      if (acc.name === this.name) {
        this.nameError = this.$tc("addByAddress.ui.message.duplicateName");
        return;
      }
    }
    this.submitting = true;
    store.dispatch("createAccountBySerial", this.name);
    this.close();
  }

  submit(): void {
    this.addAccount().finally(() => (this.submitting = false));
  }
}
</script>
