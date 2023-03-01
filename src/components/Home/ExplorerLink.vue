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
        <b-slider v-model="maxAddress" :max="12" :min="1" indicator ticks lazy></b-slider>
      </b-field>
      <b-tabs position="is-centered" v-model="addressType" expanded @input="changeAddressType">
        <b-tab-item :label="$t('explorerLink.ui.label.observer')" icon="eye-check" value="Observed">
          <div class="has-text-centered">
            <qrcode-vue :value="externalExplorerPrefix + address" size="200" class="qrcode" style="width: 220px"></qrcode-vue>
            <key-box icon="checkbox-multiple-blank-outline" :value="address" :showValue="true"></key-box>
            <b-tooltip :label="$t('explorerLink.ui.tooltip.blockchainExplorer')">
              <a target="_blank" :href="externalExplorerPrefix + address">
                <b-icon class="pl-4" icon="open-in-new" size="is-small"></b-icon>
              </a>
            </b-tooltip>
          </div>
        </b-tab-item>
        <b-tab-item
          :label="$t('explorerLink.ui.label.nonObserver')"
          icon="security"
          value="Hardened"
          v-if="account.type != 'PublicKey'"
        >
          <div class="has-text-centered">
            <qrcode-vue :value="externalExplorerPrefix + address" size="200" class="qrcode" style="width: 220px"></qrcode-vue>
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
            <th>{{ $t("explorerLink.ui.label.sign") }}</th>
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
            <td>{{ convertAddress(addr.address) }}</td>
            <td>{{ addr.coins.filter((_) => _.coin && !_.spent).length }}</td>
            <td>
              <b-button size="is-small" @click="openSignMessage(addr.address)">{{
                $t("explorerLink.ui.label.sign")
              }}</b-button>
            </td>
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
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import store from "@/store/index";
import { AccountEntity, AccountToken, AccountTokenAddress } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import { shorten } from "@/filters/addressConversion";
import TopBar from "@/components/Common/TopBar.vue";
import puzzle, { AddressType } from "@/services/crypto/puzzle";
import { notifyPrimary } from "@/services/notification/notification";
import { xchSymbol } from "@/store/modules/network";
import { getCnsName, reverseResolveAnswer } from "@/services/api/reverseResolve";
import SignMessage from "../Cryptography/SignMessage.vue";
import { isMobile } from "@/services/view/responsive";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
    TopBar,
  },
})
export default class ExplorerLink extends Vue {
  @Prop() public account!: AccountEntity;
  public address = "";
  public addressType: AddressType = "Observed";
  public cnsNames: reverseResolveAnswer[] = [];

  get externalExplorerPrefix(): string {
    return store.state.network.network.explorerUrl;
  }

  get token(): AccountToken {
    return this.account.tokens[xchSymbol()];
  }

  get addresses(): AccountTokenAddress[] {
    return this.token.addresses.filter((a) => a.type == this.addressType);
  }

  get maxAddress(): number {
    return this.account.addressRetrievalCount;
  }

  set maxAddress(value: number) {
    if (this.maxAddress == value) return;
    if (value && value < 13) {
      this.account.addressRetrievalCount = value;
      store.dispatch("refreshAddress");
      notifyPrimary(this.$tc("common.message.saved"));
    }
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  @Watch("addresses")
  async addressToCns(): Promise<void> {
    const queries = this.addresses.map((addr) => puzzle.getPuzzleHashFromAddress(addr.address));
    this.cnsNames = await getCnsName(queries);
  }

  changeAddressType(): void {
    this.address = this.addresses[0].address;
  }

  convertAddress(address: string): string {
    const res = this.cnsNames.find((cns) => cns.address == puzzle.getPuzzleHashFromAddress(address) && cns.cns);
    if (res && res.cns) return res.cns;
    return shorten(address);
  }

  openSignMessage(xch: string): void {
    this.$buefy.modal.open({
      parent: this,
      component: SignMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        xch: xch,
      },
    });
  }

  shorten(name: string): string {
    return shorten(name);
  }

  async mounted(): Promise<void> {
    Vue.set(this, "address", this.addresses[0].address);
    await this.addressToCns();
  }

  @Emit("close")
  close(): void {
    store.dispatch("refreshBalance");
    return;
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
