<template>
  <section>
    <b-field :label="$t('addressBookField.ui.label.name')">
      <b-input v-model="name" maxlength="36"></b-input>
    </b-field>
    <b-field :type="isLegalAddress ? '' : 'is-danger'">
      <template #label>
        {{ $t("addressBookField.ui.label.address") }}
      </template>
      <template #message>
        <span v-if="errorMessage">
          {{ errorMessage }}
        </span>
        <span v-if="resolvedAddress" class="break-all">
          {{ resolvedAddress }}
        </span>
        <span v-if="cnsName" class="break-all">
          <b-tag type="is-link is-light">{{ cnsName }}</b-tag>
        </span>
      </template>
      <b-input
        v-model="address"
        ref="address"
        :placeholder="$t('addressBookField.ui.placeholder.address')"
        expanded
        @input.enter.native="resetErr"
        :custom-class="isLegalAddress ? '' : 'is-danger'"
        :loading="isResolving"
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
import { resolveName, StandardResolveAnswer } from "@/services/api/resolveName";
import { getCnsName, reverseResolveAnswer } from "@/services/api/reverseResolve";
import puzzle from "../../../../lib-chia/services/crypto/puzzle";
import { CoinSpend } from "../../../../lib-chia/services/spendbundle";
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
  public isResolving = false;
  public errorMessage = "";
  public resolveAnswer: StandardResolveAnswer | null = null;
  public cnsResolve: reverseResolveAnswer | null = null;
  public proofCoin: CoinSpend | null = null;
  public cnsName = "";
  public resolvedAddress = "";

  async resetErr(): Promise<void> {
    this.isLegalAddress = true;
    this.errorMessage = "";
    this.resolveAnswer = null;
    this.cnsResolve = null;
    this.cnsName = "";
    this.resolvedAddress = "";
    if (this.address.match(/[a-zA-Z0-9-]{4,}\.xch$/)) {
      this.isResolving = true;
      this.resolveAnswer = await resolveName(this.address);
      this.isResolving = false;
      if (this.resolveAnswer?.status == "Found") {
        this.resolvedAddress = puzzle.getAddressFromPuzzleHash(this.resolveAnswer.data ?? "", xchPrefix());
      }
    } else if (this.address.startsWith(xchPrefix())) {
      this.isResolving = true;
      var res = await getCnsName([puzzle.getPuzzleHashFromAddress(this.address)]);
      if (res.length) this.cnsResolve = res[0];
      this.cnsName = this.cnsResolve?.cns ?? "";
      this.isResolving = false;
    }
  }

  save(): void {
    if (this.address.length < 1) {
      this.isLegalAddress = false;
      this.errorMessage = this.$tc("addressBookField.ui.messages.emptyAddress");
      return;
    }
    if (this.resolvedAddress) {
      this.$emit("save", this.name, this.resolvedAddress);
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
<style scoped lang="scss">
.break-all {
  word-break: break-all;
}
</style>
