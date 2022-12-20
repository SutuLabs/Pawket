<template>
  <div>
    <b-dropdown aria-role="list" :triggers="['click', 'hover']" :mobile-modal="false">
      <template #trigger>
        <button class="button border-less" aria-haspopup="true" aria-controls="dropdown-menu">
          <span :class="getdotStyle(networkId)">
            <i v-if="!offline" class="mdi mdi-brightness-1"></i> <i v-else class="mdi mdi-alert"></i
          ></span>
          <span class="has-text-grey">{{ networkId }}</span>
          <span class="icon is-small"> <i class="mdi mdi-menu-down"></i> </span>
        </button>
      </template>
      <b-dropdown-item
        aria-role="listitem"
        :class="{
          button: true,
          'dropdown-item': true,
          'has-text-left': true,
          'is-active': networkId == network.name,
        }"
        v-for="network of networks"
        :key="network.name"
        @click="networkId = network.name"
      >
        <span :class="getdotStyle(network.name, false)"> <i class="mdi mdi-brightness-1"></i> </span
        ><span>{{ network.name }}</span></b-dropdown-item
      >
      <div v-if="experimentMode">
        <hr class="dropdown-divider" />
        <b-button type="is-primary" icon-left="plus" size="is-small" outlined @click="addNetwork()">{{
          $t("addNetwork.ui.button.addNetwork")
        }}</b-button>
      </div>
    </b-dropdown>
  </div>
</template>
<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import { NetworkInfo } from "@/store/modules/network";
import { isMobile } from "@/services/view/responsive";
import AddNetwork from "./AddNetwork.vue";

@Component({})
export default class NetworkSelector extends Vue {
  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.dispatch("switchNetwork", value);
    store.dispatch("refreshBalance");
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get offline(): boolean {
    return store.state.vault.disconnected;
  }

  getdotStyle(networkId: string, greyOnOffline = true): string {
    let color = "has-text-grey";
    if (this.offline && greyOnOffline) {
      color = "has-text-danger";
    } else {
      if (networkId == "testnet10") color = "has-text-info";
      if (networkId == "mainnet") color = "has-text-primary";
    }
    return `icon is-small ${color}`;
  }

  addNetwork(): void {
    this.$buefy.modal.open({
      parent: this.$parent,
      component: AddNetwork,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
    });
  }
}
</script>
<style scoped lang="scss">
.border-less {
  border: none;
}
</style>
