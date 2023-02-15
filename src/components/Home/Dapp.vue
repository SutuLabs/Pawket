<template>
  <div>
    <a href="javascript:void(0)" @click="toggleDapp()">
      <p class="has-text-weight-bold is-size-5 mb-5">
        {{ $t("accountDetail.ui.dApps.title") }}
        <b-icon class="is-pulled-right" :icon="displayDapp ? 'menu-up' : 'menu-down'" size="is-medium"></b-icon>
      </p>
    </a>
    <div v-if="displayDapp" class="columns is-mobile is-multiline mt-2">
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered" style="display: none">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.donate')" position="is-right">
          <a href="javascript:void(0)" @click="openDonation()" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="hand-heart-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.donate") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.scanAssets')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/scan-assets')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="credit-card-scan" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.scanAssets") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <!-- TODO: When enablin g experimental mode, dialog box lists both makeOffer and takeOffer
                 as experimental features, but they seem to be enabled regardless of experimental
                 mode being enabled. Change dialog text? -->
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.takeOffer')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/take-offer')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="email-check-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.takeOffer") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.makeOffer')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/make-offer')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="email-send-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.makeOffer") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintNft')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/mint-nft')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="tag-faces" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.mintNft") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
    </div>
    <div v-if="displayDapp" class="columns is-mobile is-multiline mt-2">
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintCat')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/issue-cat')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="cat" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.mintCat") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.batchSend')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/batch-send')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="share-all-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.batchSend") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.proxy')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/proxy')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="router-network" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.proxy") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode && debugMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.batchMintNft')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/batch-mint-nft')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="image-multiple-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.batchMintNft") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.verify')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/verify-message')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="comment-check-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.verify") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.encryptMessage')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/encrypt-message')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="lock-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.encryptMessage") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.decryptMessage')" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/decrypt-message')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="lock-open-variant-outline" size="is-medium"></b-icon>
              <p class="is-size-7">{{ $t("accountDetail.ui.dApps.button.decryptMessage") }}</p>
            </div>
          </a>
        </b-tooltip>
      </div>
      <div v-if="experimentMode" class="column px-1 is-1-desktop is-3-mobile has-text-centered">
        <b-tooltip label="Split Coin" position="is-right">
          <a href="javascript:void(0)" @click="$router.push('/home/split-coin')" class="has-text-link">
            <div class="has-text-centered">
              <b-icon icon="call-split" size="is-medium"></b-icon>
              <p class="is-size-7">Split Coin</p>
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
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import MintCat from "@/components/Mint/MintCat.vue";
import MintNft from "@/components/Mint/MintNft.vue";
import BatchMintNft from "@/components/Mint/BatchMintNft.vue";
import MakeOffer from "@/components/Offer/Make.vue";
import TakeOffer from "@/components/Offer/Take.vue";
import ScanAssets from "@/components/ScanAssets/ScanAssets.vue";
import BatchSend from "@/components/Transfer/BatchSend.vue";
import { NotificationProgrammatic as Notification } from "buefy";
import Donate from "@/components/Settings/Donate.vue";
import { isMobile } from "@/services/view/responsive";
import VerifyMessage from "../Cryptography/VerifyMessage.vue";
import DecryptMessage from "../Cryptography/DecryptMessage.vue";
import EncryptMessage from "../Cryptography/EncryptMessage.vue";
import SplitCoin from "@/components/Mint/SplitCoin.vue";

@Component
export default class Dapp extends Vue {
  @Prop() public account!: AccountEntity;
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

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    switch (this.path) {
      case "/home/take-offer":
        this.openTakeOffer();
        break;
      case "/home/make-offer":
        this.openMakeOffer();
        break;
      case "/home/proxy":
        this.showProxy();
        break;
      case "/home/batch-send":
        this.openBatchSend();
        break;
      case "/home/issue-cat":
        this.openMintCat();
        break;
      case "/home/mint-nft":
        this.openMintNft();
        break;
      case "/home/batch-mint-nft":
        this.openBatchMintNft();
        break;
      case "/home/scan-assets":
        this.openScanAssets();
        break;
      case "/home/verify-message":
        this.openVerifyMessage();
        break;
      case "/home/encrypt-message":
        this.openEncryptMessage();
        break;
      case "/home/decrypt-message":
        this.openDecryptMessage();
        break;
      case "/home/split-coin":
        this.openSplitCoin();
        break;
      default:
        break;
    }
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

  async showProxy(): Promise<void> {
    this.$buefy.modal.open({
      parent: this,
      component: (await import("@/components/Offline/OfflineSpendBundleQr.vue")).default,
      hasModalCard: true,
      fullScreen: isMobile(),
      onCancel: () => this.$router.back(),
      canCancel: ["escape", "outside"],
      trapFocus: true,
      props: { mode: "OFFLINE_CLIENT", account: this.account },
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

  openBatchMintNft(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: BatchMintNft,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  openVerifyMessage(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: VerifyMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  openEncryptMessage(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: EncryptMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  openDecryptMessage(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: DecryptMessage,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  openSplitCoin(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: SplitCoin,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: {
        account: this.account,
      },
    });
  }

  openScanAssets(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: ScanAssets,
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
