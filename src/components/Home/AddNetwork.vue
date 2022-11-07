<template>
  <div class="modal-card">
    <header>
      <top-bar
        :title="mode == 'Add' ? $t('addNetwork.ui.title.add') : $t('addNetwork.ui.title.edit')"
        @close="cancel()"
      ></top-bar>
    </header>
    <section class="modal-card-body">
      <b-notification type="is-warning" has-icon role="alert" :closable="false">
        {{ $t("addNetwork.ui.warning") }}
      </b-notification>
      <b-field :label="$t('addNetwork.ui.label.rpcUrl')">
        <b-input
          v-model="rpcUrl"
          required
          :disabled="mode == 'View'"
          ref="rpcUrl"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.networkName')">
        <b-input
          v-model="networkName"
          required
          :disabled="mode != 'Add'"
          maxlength="36"
          ref="networkName"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.chainId')">
        <b-input
          v-model="chainId"
          required
          :disabled="mode == 'View'"
          ref="chainId"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.currencySymbol')">
        <b-input
          v-model="currencySymbol"
          required
          :disabled="mode == 'View'"
          ref="currencySymbol"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.addressPrefix')">
        <b-input
          v-model="addressPrefix"
          required
          :disabled="mode == 'View'"
          ref="addressPrefix"
          oninvalid="setCustomValidity(' ')"
          oninput="setCustomValidity('')"
        ></b-input>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.decimalPlace')">
        <b-numberinput v-model="decimalPlace" min="0" min-step="1" :disabled="mode == 'View'"></b-numberinput>
      </b-field>
      <b-field :label="$t('addNetwork.ui.label.blockExplorer')">
        <b-input v-model="blockExplorer" :disabled="mode == 'View'"></b-input>
      </b-field>
    </section>
    <footer class="modal-card-foot is-block">
      <b-button @click="cancel()" class="is-pulled-left">{{ $t("addressBookField.ui.button.cancel") }}</b-button>
      <div class="is-pulled-right">
        <b-button type="is-primary" @click="save()" v-show="mode != 'View'">{{ $t("addressBookField.ui.button.save") }}</b-button>
      </div>
    </footer>
  </div>
</template>
<script lang="ts">
import { TokenInfo } from "@/models/account";
import { getNetworkInfo } from "@/services/api/networkApi";
import { notifyPrimary } from "@/services/notification/notification";
import store from "@/store";
import { NetworkDetail } from "@/store/modules/network";
import { NotificationProgrammatic as Notification } from "buefy";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import TopBar from "../Common/TopBar.vue";

type Mode = "Add" | "Edit" | "View";

@Component({
  components: { TopBar },
})
export default class AddNetwork extends Vue {
  @Prop() inputNetwork!: NetworkDetail;
  @Prop({ default: "Add" }) mode!: Mode;

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

  @Watch("rpcUrl")
  async onPathChange(): Promise<void> {
    const net = await getNetworkInfo(this.rpcUrl);
    this.networkName = net.name || this.networkName;
    this.chainId = net.chainId || this.chainId;
    this.currencySymbol = net.symbol || this.currencySymbol;
    this.addressPrefix = net.prefix || this.addressPrefix;
    this.decimalPlace = net.decimal || this.decimalPlace;
    this.blockExplorer = net.explorerUrl || this.blockExplorer;
  }

  save(): void {
    if (!this.validate()) return;
    if (this.mode == "Add" && store.state.network.networks[this.networkName]) {
      Notification.open({
        message: this.$tc("addNetwork.message.notification.networkExists"),
        type: "is-danger",
        duration: 5000,
      });
      return;
    }
    const tokenInfo: TokenInfo = {};
    tokenInfo[this.currencySymbol] = {
      symbol: this.currencySymbol,
      decimal: this.decimalPlace,
      unit: this.currencySymbol,
    };
    const network: NetworkDetail = {
      name: this.networkName,
      rpcUrl: this.rpcUrl,
      prefix: this.addressPrefix,
      symbol: this.currencySymbol,
      chainId: this.chainId,
      explorerUrl: this.blockExplorer,
      spaceScanUrl: this.blockExplorer,
      tokenInfo: tokenInfo,
    };
    store.dispatch("addOrUpdateNetwork", network);
    if (this.mode == "Add") notifyPrimary(this.$tc("common.message.added"));
    if (this.mode == "Edit") notifyPrimary(this.$tc("common.message.saved"));
    this.cancel();
  }

  mounted(): void {
    if (this.inputNetwork) {
      this.networkName = this.inputNetwork.name;
      this.rpcUrl = this.inputNetwork.rpcUrl;
      this.chainId = this.inputNetwork.chainId;
      this.currencySymbol = this.inputNetwork.symbol;
      this.addressPrefix = this.inputNetwork.prefix;
      this.decimalPlace = this.inputNetwork.tokenInfo[this.currencySymbol]
        ? this.inputNetwork.tokenInfo[this.currencySymbol].decimal
        : 12;
      this.blockExplorer = this.inputNetwork.explorerUrl;
    }
  }
}
</script>
<style scoped lang="scss"></style>
