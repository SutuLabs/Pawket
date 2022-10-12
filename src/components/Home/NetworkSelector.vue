<template>
  <div>
    <div :class="{ dropdown: true, 'is-active': isActive }">
      <div class="dropdown-trigger button is-white" @click="isActive = !isActive">
        <span :class="getdotStyle(networkId)"> <i class="mdi mdi-brightness-1"></i> </span>
        <span>{{ networkId }}</span>
        <span class="icon is-small"> <i class="mdi mdi-menu-down"></i> </span>
      </div>
      <div class="dropdown-menu" id="dropdown-menu" role="menu">
        <div class="dropdown-content">
          <button
            class="button is-white dropdown-item has-text-left"
            v-for="network of networks"
            :key="network.name"
            @click="networkId = network.name"
          >
            <span :class="getdotStyle(network.name)"> <i class="mdi mdi-brightness-1"></i> </span><span>{{ network.name }}</span>
          </button>
          <hr class="dropdown-divider" />
          <b-button type="is-primary" icon-left="plus" size="is-small" outlined @click="addNetwork()">Add Network</b-button>
        </div>
      </div>
    </div>
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
  isActive = false;

  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.dispatch("switchNetwork", value);
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get offline(): boolean {
    return store.state.account.offline;
  }

  getdotStyle(networkId: string): string {
    let color = "has-text-grey";
    if (this.offline) {
      color = "has-text-dark";
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
<style scoped lang="scss"></style>
