<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('explorerLink.ui.title.link')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-field>
        <template #label>
          <span>{{ $t("explorerLink.ui.label.maxAddress") }}</span>
          <b-tooltip :label="$t('explorerLink.ui.tooltip.receiveAddress')" position="is-bottom" multilined>
            <b-icon icon="help-circle" size="is-small"> </b-icon>
          </b-tooltip>
        </template>
        <b-numberinput
          controls-alignment="left"
          v-model="maxAddress"
          @click.native="clicked = true"
          @mouseleave.native="changeMaxAddress"
          :max="12"
          ref="maxAddress"
        ></b-numberinput>
      </b-field>
      <b-tabs position="is-centered" v-model="addressType" expanded @input="changeAddressType">
        <b-tab-item :label="$t('explorerLink.ui.label.observer')" icon="eye-check" value="Observed">
          <div class="has-text-centered">
            <qrcode-vue :value="externalExplorerPrefix + address" size="200"></qrcode-vue>
            <key-box icon="checkbox-multiple-blank-outline" :value="address" :showValue="true"></key-box>
            <b-tooltip :label="$t('explorerLink.ui.tooltip.blockchainExplorer')">
              <a target="_blank" :href="externalExplorerPrefix + address">
                <b-icon class="pl-4" icon="open-in-new" size="is-small"></b-icon>
              </a>
            </b-tooltip>
          </div>
        </b-tab-item>
        <b-tab-item :label="$t('explorerLink.ui.label.nonObserver')" icon="security" value="Hardened">
          <div class="has-text-centered">
            <qrcode-vue :value="externalExplorerPrefix + address" size="200"></qrcode-vue>
            <key-box icon="checkbox-multiple-blank-outline" :value="address" :showValue="true"></key-box>
            <b-tooltip :label="$t('explorerLink.ui.tooltip.blockchainExplorer')">
              <a target="_blank" :href="externalExplorerPrefix + address">
                <b-icon class="pl-4" icon="open-in-new" size="is-small"></b-icon>
              </a>
            </b-tooltip>
          </div>
        </b-tab-item>
      </b-tabs>
      <table class="table has-text-centered is-fullwidth">
        <thead>
          <tr>
            <th>{{ $t("explorerLink.ui.label.address") }}</th>
            <th>{{ $t("explorerLink.ui.label.coin") }}</th>
            <th>{{ $t("explorerLink.ui.label.link") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="addr in addresses"
            :key="addr.address"
            @click="address = addr.address"
            :class="{ 'hover-primary': true, 'is-clickable': true, 'is-selected': address == addr.address }"
          >
            <td>{{ addr.address | shorten }}</td>
            <td>{{ addr.coins.filter((_) => _.coin && !_.spent).length }}</td>
            <td>
              <a target="_blank" :href="externalExplorerPrefix + addr.address">
                <b-icon icon="open-in-new" size="is-small"></b-icon>
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import store from "@/store/index";
import { AccountEntity, AccountToken, AccountTokenAddress } from "@/store/modules/account";
import KeyBox from "@/components/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { shorten } from "@/filters/addressConversion";
import TopBar from "./TopBar.vue";
import { AddressType } from "@/services/crypto/puzzle";
import { notifyPrimary } from "@/notification/notification";
import { xchSymbol } from "@/store/modules/network";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
    TopBar,
  },
  filters: { shorten },
})
export default class ExplorerLink extends Vue {
  @Prop() private account!: AccountEntity;
  public address = "";
  public maxAddress = 0;
  public addressType: AddressType = "Observed";
  public clicked = false;

  get externalExplorerPrefix(): string {
    return store.state.app.externalExplorerPrefix;
  }

  get token(): AccountToken {
    return this.account.tokens[xchSymbol()];
  }

  get explorerUrl(): string {
    return store.state.network.network.explorerUrl;
  }

  get addresses(): AccountTokenAddress[] {
    return this.token.addresses.filter((a) => a.type == this.addressType);
  }

  changeAddressType(): void {
    this.address = this.addresses[0].address;
  }

  mounted(): void {
    Vue.set(this, "address", this.addresses[0].address);
    Vue.set(this, "maxAddress", this.account.addressRetrievalCount);
  }

  @Emit("close")
  close(): void {
    return;
  }

  async changeMaxAddress(): Promise<void> {
    if (this.clicked && this.maxAddress && this.maxAddress < 13) {
      this.account.addressRetrievalCount = this.maxAddress;
      notifyPrimary(this.$tc("common.message.saved"));
      await store.dispatch("refreshBalance");
      this.clicked = false;
    }
  }
}
</script>

<style scoped lang="scss">
// Import Bulma's core
@import "~bulma/sass/utilities/derived-variables";
.hover-primary:hover {
  background-color: $primary;
  color: white;
}

.hover-primary:active {
  background-color: $primary;
  color: white;
}

.margin-auto {
  margin: auto !important;
}
</style>
