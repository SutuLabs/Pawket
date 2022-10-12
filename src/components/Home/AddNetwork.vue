<template>
  <div class="modal-card">
    <header>
      <top-bar :title="$t('addNetwork.ui.title')" @close="cancel()"></top-bar>
    </header>
    <section class="modal-card-body">
      <b-notification type="is-warning" has-icon role="alert" :closable="false">
        {{ $t("addNetwork.ui.warning") }}
      </b-notification>
      <b-field :label="$t('addNetwork.ui.label.networkName')">
        <b-input
          v-model="networkName"
          required
          maxlength="36"
          ref="networkName"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.rpcUrl')">
        <b-input
          v-model="rpcUrl"
          required
          ref="rpcUrl"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.chainId')">
        <b-input
          v-model="chainId"
          required
          ref="chainId"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.currencySymbol')">
        <b-input
          v-model="currencySymbol"
          required
          ref="currencySymbol"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.addressPrefix')">
        <b-input
          v-model="addressPrefix"
          required
          ref="addressPrefix"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.decimalPlace')">
        <b-numberinput v-model="decimalPlace" min="0" min-step="1"></b-numberinput>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.blockExplorer')">
        <b-input v-model="blockExplorer"></b-input>
      </b-field>
    </section>
    <footer class="modal-card-body">
      <b-button @click="cancel()" class="is-pulled-left">{{ $t("addressBookField.ui.button.cancel") }}</b-button>
      <div class="is-pulled-right">
        <b-button type="is-primary" @click="save()">{{ $t("addressBookField.ui.button.save") }}</b-button>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import store from "@/store";
import { NetworkDetail } from "@/store/modules/network";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "../Common/TopBar.vue";

@Component({
  components: { TopBar },
})
export default class AddNetwork extends Vue {
  networkName = "";
  rpcUrl = "";
  chainId = "";
  currencySymbol = "";
  addressPrefix = "";
  decimalPlace = 12;
  blockExplorer = "";

  validate(): boolean {
    const total = 5;
    let count = 0;
    if ((this.$refs.networkName as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) count++;
    if ((this.$refs.rpcUrl as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) count++;
    if ((this.$refs.chainId as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) count++;
    if ((this.$refs.currencySymbol as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) count++;
    if ((this.$refs.addressPrefix as Vue & { checkHtml5Validity: () => boolean }).checkHtml5Validity()) count++;
    if (count != total) return false;
    return true;
  }

  cancel(): void {
    this.$emit("close");
  }

  save(): void {
    if (!this.validate()) return;
    const network: NetworkDetail = {
      name: this.networkName,
      rpcUrl: this.rpcUrl,
      prefix: this.addressPrefix,
      symbol: this.currencySymbol,
      chainId: this.chainId,
      explorerUrl: this.blockExplorer,
      spaceScanUrl: this.blockExplorer,
      tokenInfo: {},
    };
    store.dispatch("addNetwork", network);
    return;
  }
}
</script>
<style scoped lang="scss"></style>
