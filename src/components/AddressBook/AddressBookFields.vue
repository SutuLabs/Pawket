<template>
  <section>
    <b-field :label="$t('addressBookField.ui.label.name')">
      <b-input v-model="name" max-length="36"></b-input>
    </b-field>
    <b-field :label="$t('addressBookField.ui.label.address')" type="is-danger" :message="errorMessage">
      <b-input
        v-model="address"
        ref="address"
        expanded
        @input.enter.native="resetErr"
        :custom-class="isLegalAddress ? '' : 'is-danger'"
      ></b-input>
      <p class="control">
        <b-button @click="scanQrCode()">
          <b-icon icon="scan-helper"></b-icon>
        </b-button>
      </p>
    </b-field>
    <div>
      <b-button @click="cancel()">{{ $t("addressBookField.ui.button.cancel") }}</b-button>
      <div class="is-pulled-right">
        <b-button v-if="isEdit" type="is-danger mx-2" @click="remove()" outlined>{{
          $t("addressBookField.ui.button.delete")
        }}</b-button>
        <b-button type="is-primary" @click="save()">{{ $t("addressBookField.ui.button.save") }}</b-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import { Component, Prop, Vue } from "vue-property-decorator";
import ScanQrCode from "../ScanQrCode.vue";

@Component
export default class AddressBookField extends Vue {
  @Prop({ default: "" }) private defaultName!: string;
  @Prop({ default: "" }) private defaultAddress!: string;
  @Prop({ default: false }) public isEdit!: boolean;

  public name = this.defaultName;
  public address = this.defaultAddress;
  public isLegalAddress = true;
  public errorMessage = "";

  resetErr(): void {
    this.isLegalAddress = true;
    this.errorMessage = "";
  }

  save(): void {
    if (this.address.length < 1) {
      this.isLegalAddress = false;
      this.errorMessage = this.$tc("addressBookField.ui.messages.emptyAddress");
      return;
    }
    try {
      Bytes.from(bech32m.decodeToBytes(this.address).bytes).hex();
    } catch (error) {
      this.isLegalAddress = false;
      this.errorMessage = this.$tc("addressBookField.ui.messages.illegalAddress");
      return;
    }
    this.$emit("save", this.name, this.address);
  }

  cancel(): void {
    this.$emit("cancel");
  }

  remove(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("addressBookField.messages.removeConfirm"),
      confirmText: this.$tc("addressBookField.ui.button.confirm"),
      cancelText: this.$tc("addressBookField.ui.button.cancel"),
      onConfirm: () => this.$emit("remove"),
    });
  }

  scanQrCode(): void {
    this.resetErr();
    this.$buefy.modal.open({
      parent: this,
      component: ScanQrCode,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.address = value;
        },
      },
    });
  }
}
</script>
