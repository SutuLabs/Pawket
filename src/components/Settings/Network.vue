<template>
  <div class="modal-card m-0">
    <header>
      <top-bar :title="$t('settings.menu.items.network.title')" @close="$router.push('/settings')"></top-bar>
    </header>
    <section class="modal-card-body">
      <b-button type="is-primary" expanded icon-left="plus" @click="addNetwork">{{
        $t("addNetwork.ui.button.addNetwork")
      }}</b-button>
      <div class="mt-4">
        <a
          href="javascript:void(0)"
          v-for="(network, i) of networks"
          :key="i"
          class="panel-block is-mobile"
          @click="showDetail(network)"
        >
          <div class="column">
            <span :class="getdotStyle(network.name)"> <i class="mdi mdi-brightness-1"></i> </span><span>{{ network.name }}</span>
          </div>
          <div class="is-pulled-right">
            <b-button type="is-text" v-if="!isDefaultNetwork(network.name)" @click.stop="deleteNetwork(network.name)"
              ><b-icon icon="trash-can-outline"></b-icon
            ></b-button>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { isMobile } from "@/services/view/responsive";
import store from "@/store";
import { isDefaultNetwork, NetworkDetail, NetworkInfo } from "@/store/modules/network";
import { Component, Vue } from "vue-property-decorator";
import TopBar from "../Common/TopBar.vue";
import AddNetwork from "../Home/AddNetwork.vue";

type Mode = "List" | "Edit" | "Add";

@Component({ components: { TopBar, AddNetwork } })
export default class Network extends Vue {
  mode: Mode = "List";

  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.dispatch("switchNetwork", value);
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  isDefaultNetwork(name: string): boolean {
    return isDefaultNetwork(name);
  }

  getdotStyle(networkId: string): string {
    let color = "has-text-grey";
    if (networkId == "testnet10") color = "has-text-info";
    if (networkId == "mainnet") color = "has-text-primary";
    return `icon is-normal ${color}`;
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

  showDetail(network: NetworkDetail): void {
    let mode = "Edit";
    if (this.isDefaultNetwork(network.name)) mode = "View";
    this.$buefy.modal.open({
      parent: this.$parent,
      component: AddNetwork,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { inputNetwork: network, mode: mode },
    });
  }

  deleteNetwork(name: string): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("addNetwork.message.confirmation.delete"),
      confirmText: this.$tc("common.button.confirm"),
      cancelText: this.$tc("common.button.cancel"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: async () => {
        await store.dispatch("deleteNetwork", name);
      },
    });
  }
}
</script>
<style scoped lang="scss"></style>
