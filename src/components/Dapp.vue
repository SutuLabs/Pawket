<template>
  <div>
    <a href="javascript:void(0)" @click="toggleDapp()">
      <p class="has-text-weight-bold is-size-5 mb-5">
        {{ $t("accountDetail.ui.dApps.title") }}
        <b-icon class="is-pulled-right" :icon="displayDapp ? 'menu-up' : 'menu-down'" size="is-medium"></b-icon>
      </p>
    </a>
    <div v-if="displayDapp" class="columns is-mobile is-multiline mt-2">
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.donate')" position="is-right">
          <a href="javascript:void(0)" @click="openDonation()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="hand-heart-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.donate") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.proxy')" position="is-right">
          <a href="javascript:void(0)" @click="showProxy()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="router-network" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.proxy") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.takeOffer')" position="is-right">
          <a v-if="experimentMode" href="javascript:void(0)" @click="openTakeOffer()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="email-check-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.takeOffer") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.makeOffer')" position="is-right">
          <a v-if="experimentMode" href="javascript:void(0)" @click="openMakeOffer()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="email-send-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.makeOffer") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.batchSend')" position="is-right">
          <a v-if="experimentMode" href="javascript:void(0)" @click="openBatchSend()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="share-all-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.batchSend") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintCat')" position="is-right">
          <a v-if="experimentMode" href="javascript:void(0)" @click="openMintCat()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="cat" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.mintCat") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintNft')" position="is-right">
          <a v-if="experimentMode && testnet" href="javascript:void(0)" @click="openMintNft()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="tag-faces" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.mintNft") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import store from "@/store";
import { AccountEntity, CustomCat } from "@/models/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import MintCat from "./Mint/MintCat.vue";
import MintNft from "./Mint/MintNft.vue";
import MakeOffer from "./Offer/Make.vue";
import TakeOffer from "./Offer/Take.vue";
import BatchSend from "./Transfer/BatchSend.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import Donate from "./Settings/Donate.vue";
import { isMobile } from "@/services/view/responsive";
import OfflineQrCode from "./OfflineQrCode.vue";
import { xchPrefix } from "@/store/modules/network";

@Component
export default class Dapp extends Vue {
  @Prop() private account!: AccountEntity;
  @Prop() tokenList!: CustomCat[];

  public displayDapp = true;

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get testnet(): boolean {
    return store.state.network.networkId == "testnet10";
  }

  get observeMode(): boolean {
    return this.account.type == "Address";
  }

  mounted(): void {
    this.displayDapp = localStorage.getItem("DISPLAY_DAPP") ? localStorage.getItem("DISPLAY_DAPP") === "true" : true;
  }

  toggleDapp(): void {
    this.displayDapp = !this.displayDapp;
    localStorage.setItem("DISPLAY_DAPP", this.displayDapp.toString());
  }

  checkObserveMode(): void {
    if (this.observeMode) {
      Notification.open({
        message: this.$tc("accountDetail.message.notification.observeMode"),
        type: "is-warning",
      });
      throw new Error("Interaction function disabled in Observe Mode");
    }
  }

  openDonation(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: Donate,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
    });
  }

  openTakeOffer(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        tokenList: this.tokenList,
      },
    });
  }

  openMakeOffer(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: MakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  showProxy(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfflineQrCode,
      hasModalCard: true,
      fullScreen: isMobile(),
      canCancel: [""],
      trapFocus: true,
      props: { mode: "PROXY", prefix: xchPrefix() },
    });
  }

  openBatchSend(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: BatchSend,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  openMintCat(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: MintCat,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
        tokenList: this.tokenList,
      },
    });
  }

  openMintNft(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: MintNft,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
