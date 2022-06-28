<template>
  <div>
    <div class="buttons is-mobile is-multiline">
      <div v-if="experimentMode" class="px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.takeOffer')" position="is-right">
          <b-button @click="openTakeOffer()" class="has-text-link" size="is-medium">
            <div class="has-text-centered">
              <b-icon icon="email-check-outline" size="is-medium"></b-icon>
            </div>
          </b-button>
          <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.takeOffer") }}</p>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.makeOffer')" position="is-right">
          <b-button href="javascript:void(0)" @click="openMakeOffer()" class="has-text-link" size="is-medium">
            <div class="has-text-centered">
              <b-icon icon="email-send-outline" size="is-medium"></b-icon>
            </div>
          </b-button>
          <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.makeOffer") }}</p>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.batchSend')" position="is-right">
          <b-button @click="openBatchSend()" class="has-text-link" size="is-medium">
            <div class="has-text-centered">
              <b-icon icon="share-all-outline" size="is-medium"></b-icon>
            </div>
          </b-button>
          <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.batchSend") }}</p>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintCat')" position="is-right">
          <b-button @click="openMintCat()" class="has-text-link" size="is-medium">
            <div class="has-text-centered">
              <b-icon icon="cat" size="is-medium"></b-icon>
            </div>
          </b-button>
          <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.mintCat") }}</p>
        </b-tooltip>
      </div>
      <div v-if="experimentMode && testnet" class="px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintNft')" position="is-right">
          <b-button @click="openMintNft()" class="has-text-link" size="is-medium">
            <div class="has-text-centered">
              <b-icon icon="tag-faces" size="is-medium"></b-icon>
            </div>
          </b-button>
          <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.mintNft") }}</p>
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
import MintCat from "@/components/Mint/MintCat.vue";
import MintNft from "@/components/Mint/MintNft.vue";
import MakeOffer from "@/components/Offer/Make.vue";
import TakeOffer from "@/components/Offer/Take.vue";
import Send from "@/components/Send.vue";
import BatchSend from "@/components/Transfer/BatchSend.vue";
import { NotificationProgrammatic as Notification } from "buefy";

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
    const donationAddress = puzzle.getAddressFromPuzzleHash(
      "d19c05a54dacbf2b40ff4843534c47976de90246c3fc42ac1f42ea81b434b8ea",
      xchPrefix()
    );
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
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
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: TakeOffer,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
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
      props: {
        account: this.account,
      },
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
      props: {
        account: this.account,
      },
    });
  }
}
</script>

<style scoped lang="scss"></style>
