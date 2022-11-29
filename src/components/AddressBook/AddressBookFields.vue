<template>
  <section>
    <b-field :label="$t('addressBookField.ui.label.name')">
      <b-input v-model="name" maxlength="36"></b-input>
    </b-field>
    <b-field :label="$t('addressBookField.ui.label.address')" :type="isLegalAddress ? '' : 'is-danger'" :message="errorMessage">
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
        <b-button type="is-primary" @click="save()">{{ $t("addressBookField.ui.button.save") }}</b-button>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { decodeAddress } from "@/services/view/camera";
import { xchPrefix } from "@/store/modules/network";
import { bech32m } from "@scure/base";
import { Bytes } from "clvm";
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class AddressBookField extends Vue {
  @Prop({ default: "" }) public defaultName!: string;
  @Prop({ default: "" }) public defaultAddress!: string;
  @Prop({ default: false }) public isEdit!: boolean;

  public name = "";
  public address = "";
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

  async scanQrCode(): Promise<void> {
    this.resetErr();
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Common/ScanQrCode.vue")).default,
      hasModalCard: true,
      trapFocus: true,
      props: {},
      events: {
        scanned: (value: string): void => {
          this.address = decodeAddress(xchPrefix(), value) ?? this.address;
        },
      },
    });
  }

  mounted(): void {
    this.name = this.defaultName;
    this.address = this.defaultAddress;
  }
}
</script>
