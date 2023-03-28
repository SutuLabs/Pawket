<template>
  <div class="modal-card margin-auto">
    <top-bar :title="$t('explorerLink.ui.title.link')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <div class="has-text-centered">
        <qrcode-vue :value="externalExplorerPrefix + address" size="200" class="qrcode" style="width: 220px"></qrcode-vue>
        <key-box icon="checkbox-multiple-blank-outline" :value="address" :showValue="true"></key-box>
        <b-tooltip :label="$t('explorerLink.ui.tooltip.blockchainExplorer')">
          <a target="_blank" :href="externalExplorerPrefix + address">
            <b-icon class="pl-4" icon="open-in-new" size="is-small"></b-icon>
          </a>
        </b-tooltip>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit, Watch } from "vue-property-decorator";
import store from "@/store/index";
import { AccountEntity } from "@/models/account";
import KeyBox from "@/components/Common/KeyBox.vue";
import QrcodeVue from "qrcode.vue";
import TopBar from "@/components/Common/TopBar.vue";
import { ensureAddress } from "@/store/modules/network";

@Component({
  components: {
    KeyBox,
    QrcodeVue,
    TopBar,
  },
})
export default class AddressAccountQr extends Vue {
  @Prop() public account!: AccountEntity;
  public address = "";

  get externalExplorerPrefix(): string {
    return store.state.network.network.explorerUrl;
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    this.close();
  }

  mounted(): void {
    Vue.set(this, "address", ensureAddress(this.account.firstAddress));
  }

  @Emit("close")
  close(): void {
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
