<template>
  <div>
    <a href="javascript:void(0)" @click="toggleDapp()">
      <p class="has-text-weight-bold is-size-5 pb-5">
        {{ $t("accountDetail.ui.dApps.title") }}
        <b-icon class="is-pulled-right" :icon="displayDapp ? 'menu-up' : 'menu-down'" size="is-medium"></b-icon>
      </p>
    </a>
    <div v-if="displayDapp" class="columns is-mobile is-multiline">
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
import puzzle from "@/services/crypto/puzzle";
import store from "@/store";
import { AccountEntity, CustomCat } from "@/store/modules/account";
import { xchPrefix } from "@/store/modules/network";
import { Component, Prop, Vue } from "vue-property-decorator";
import MintCat from "./Mint/MintCat.vue";
import MintNft from "./Mint/MintNft.vue";
import MakeOffer from "./Offer/Make.vue";
import TakeOffer from "./Offer/Take.vue";
import Send from "./Send.vue";
import BatchSend from "./Transfer/BatchSend.vue";

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

  mounted(): void {
    this.displayDapp = localStorage.getItem("DISPLAY_DAPP") ? localStorage.getItem("DISPLAY_DAPP") === "true" : true;
  }

  toggleDapp(): void {
    this.displayDapp = !this.displayDapp;
    localStorage.setItem("DISPLAY_DAPP", this.displayDapp.toString());
  }

  openDonation(): void {
    const donationAddress = puzzle.getAddressFromPuzzleHash(
      "b4bff0c0d5d88a8bc758f8b621e8b6164baa77fbe245e60f17a18119137f84a5",
      xchPrefix()
    );
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
        inputAddress: donationAddress,
        addressEditable: false,
        notificationMessage: this.$tc("accountDetail.message.notification.donate"),
        notificationIcon: "hand-heart",
        notificationClosable: false,
      },
    });
  }

  openTakeOffer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
        tokenList: this.tokenList,
      },
    });
  }

  openMakeOffer(): void {
    this.$buefy.modal.open({
      parent: this,
      component: MakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
      },
    });
  }

  openBatchSend(): void {
    this.$buefy.modal.open({
      parent: this,
      component: BatchSend,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
      },
    });
  }

  openMintCat(): void {
    this.$buefy.modal.open({
      parent: this,
      component: MintCat,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
        tokenList: this.tokenList,
      },
    });
  }

  openMintNft(): void {
    this.$buefy.modal.open({
      parent: this,
      component: MintNft,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
