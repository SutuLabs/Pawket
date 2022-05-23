<template>
  <div class="column is-8 is-offset-2 box">
    <div class="container px-4">
      <div class="py-5 has-text-centered" v-if="account && account.key">
        <section>
          <b-tooltip :label="$t('accountDetail.ui.tooltip.setting')" class="is-pulled-left">
            <b-button @click="configureAccount()">
              <b-icon icon="cog" class="has-text-grey"> </b-icon>
            </b-button>
          </b-tooltip>
          <b-tooltip :label="$t('accountDetail.ui.tooltip.lock')" class="is-pulled-right">
            <b-button @click="lock()"><b-icon icon="lock" class="has-text-grey"> </b-icon></b-button>
          </b-tooltip>
          <b-button class="is-pulled-right" @click="selectAccount()"
            >{{ account.name | nameOmit }}: {{ account.key.fingerprint }}</b-button
          >
          <br />
          <div class="mt-5">
            <h2 class="is-size-3 py-5">
              <span class="pl-4">
                <span v-if="account.tokens && account.tokens.hasOwnProperty(xchSymbol)">
                  {{ account.tokens[xchSymbol].amount | demojo(null, 6) }}
                </span>
                <span v-else>- {{ xchSymbol }}</span>
                <b-tooltip :label="$t('accountDetail.ui.tooltip.refresh')">
                  <a class="is-size-6" href="javascript:void(0)" @click="refresh()" :disabled="refreshing">
                    <b-icon
                      :icon="refreshing ? 'autorenew' : 'refresh'"
                      :class="refreshing ? 'rotate' : 'has-text-primary'"
                      custom-size="mdi-18px"
                    >
                    </b-icon>
                  </a>
                </b-tooltip>
              </span>
            </h2>
          </div>
          <div class="b-tooltip mx-5">
            <a @click="openLink(account.tokens[xchSymbol])" href="javascript:void(0)" class="has-text-primary">
              <b-icon icon="download-circle" size="is-medium"> </b-icon>
              <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.receive") }}</p>
            </a>
          </div>
          <div class="b-tooltip mr-5">
            <a @click="showSend()" href="javascript:void(0)" class="has-text-primary">
              <b-icon icon="arrow-right-circle" size="is-medium"> </b-icon>
              <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.send") }}</p>
            </a>
          </div>
          <div v-if="debugMode" class="b-tooltip mr-5">
            <a @click="showExport()" href="javascript:void(0)" class="has-text-primary">
              <b-icon icon="alpha-e-circle" size="is-medium"> </b-icon>
              <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.export") }}</p>
            </a>
          </div>
        </section>
      </div>
    </div>
    <div id="tab"></div>
    <div class="p-2">
      <b-tabs position="is-centered" class="block" expanded>
        <b-tab-item :label="$t('accountDetail.ui.tab.asset')">
          <a class="panel-block is-justify-content-space-between py-4 has-text-grey-dark" v-for="cat of tokenList" :key="cat.id">
            <span class="is-pulled-right" v-if="account.tokens && account.tokens.hasOwnProperty(cat.name)">
              <span class="panel-icon"></span>
              <span class="" v-if="tokenInfo[cat.name]">{{ account.tokens[cat.name].amount | demojo(tokenInfo[cat.name]) }}</span>
              <span class="has-text-grey-light is-size-7 pl-3" v-if="cat.name === xchSymbol">{{
                account.tokens[cat.name].amount | xchToCurrency(rate, currency)
              }}</span>
            </span>
            <a v-if="debugMode" class="is-pulled-right" href="javascript:void(0)" @click="openLink(account.tokens[cat.name])"
              >⚓</a
            >
          </a>
          <div class="column is-full has-text-centered pt-5 mt-2">
            <a @click="ManageCats()"
              ><span class="has-color-link">{{ $t("accountDetail.ui.button.manageCats") }}</span></a
            >
          </div>
        </b-tab-item>
        <b-tab-item :label="$t('accountDetail.ui.tab.utxos')">
          <utxo-panel :tokenInfo="tokenInfo" v-model="activities" @changePage="changePage"></utxo-panel>
        </b-tab-item>
        <b-tab-item :label="'NFT'" :visible="debugMode">
          <nft-panel :account="account" @changePage="changePage"></nft-panel>
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="p-4 border-top-1">
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
          <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.mintCat')" position="is-right">
            <a v-if="debugMode" href="javascript:void(0)" @click="openMintNft()" class="has-text-link">
              <div class="has-text-centered">
                <b-icon icon="tag-faces" size="is-medium"></b-icon>
                <p class="is-size-7">Mint NFT</p>
              </div>
            </a>
          </b-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import AccountExport from "@/components/AccountExport.vue";
import AccountList from "@/components/AccountList.vue";
import AccountConfigure from "@/components/AccountConfigure.vue";
import ManageCats from "@/components/ManageCats.vue";
import ExplorerLink from "@/components/ExplorerLink.vue";
import KeyBox from "@/components/KeyBox.vue";
import Send from "./Send.vue";
import { demojo } from "@/filters/unitConversion";
import { xchToCurrency } from "@/filters/usdtConversion";
import { TokenInfo, AccountEntity, AccountToken, CustomCat } from "@/store/modules/account";
import TakeOffer from "./Offer/Take.vue";
import MakeOffer from "./Offer/Make.vue";
import BatchSend from "./Transfer/BatchSend.vue";
import { getTokenInfo } from "@/services/coin/cat";
import { getExchangeRate } from "@/services/exchange/rates";
import { CurrencyType } from "@/services/exchange/currencyType";
import UtxoPanel from "@/components/UtxoPanel.vue";
import { CoinRecord } from "@/models/wallet";
import { nameOmit } from "@/filters/nameConversion";
import MintCat from "./Mint/MintCat.vue";
import { xchSymbol } from "@/store/modules/network";
import NftPanel from "@/components/Detail/NftPanel.vue";
import MintNft from "./Mint/MintNft.vue";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
    Send,
    UtxoPanel,
    NftPanel,
  },
  filters: { demojo, xchToCurrency, nameOmit },
})
export default class AccountDetail extends Vue {
  public mode: Mode = "Verify";
  private exchangeRate = -1;
  public displayDapp = true;
  public timeoutId?: ReturnType<typeof setTimeout>;

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get activities(): CoinRecord[] {
    return this.account.activities ?? [];
  }

  get tokenList(): CustomCat[] {
    let list: CustomCat[] = [];
    for (let key in store.state.account.tokenInfo) {
      list.push({ name: store.state.account.tokenInfo[key].symbol, id: store.state.account.tokenInfo[key].id ?? xchSymbol() });
    }
    return list.concat(this.account.cats);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get currency(): CurrencyType {
    return store.state.vault.currency ? store.state.vault.currency : CurrencyType.USDT;
  }

  get currencyName(): string {
    return CurrencyType[this.currency];
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  get rate(): number {
    return this.exchangeRate;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  mounted(): void {
    this.mode = store.state.vault.passwordHash ? "Verify" : "Create";
    this.displayDapp = localStorage.getItem("DISPLAY_DAPP") ? localStorage.getItem("DISPLAY_DAPP") === "true" : false;
    this.autoRefresh(60);
  }

  unmounted(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  autoRefresh(sec = 60): void {
    this.refresh();
    this.timeoutId = setTimeout(() => this.autoRefresh(sec), 1000 * sec);
  }

  lock(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("accountDetail.message.confirmation.lock"),
      confirmText: this.$tc("accountDetail.ui.button.confirm"),
      cancelText: this.$tc("accountDetail.ui.button.cancel"),
      trapFocus: true,
      onConfirm: () => {
        store.dispatch("lock");
      },
    });
  }

  showExport(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountExport,
      hasModalCard: true,
      trapFocus: true,
      props: { account: this.account },
    });
  }

  configureAccount(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountConfigure,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { account: this.account },
      events: { refresh: this.refresh },
    });
  }

  ManageCats(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: { account: this.account, tokenList: this.tokenList },
      events: { refresh: this.refresh },
    });
  }

  selectAccount(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountList,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {},
    });
  }

  showSend(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: { account: this.account, rate: this.rate, currency: this.currency },
    });
  }

  openLink(token: AccountToken): void {
    this.$buefy.modal.open({
      parent: this,
      component: ExplorerLink,
      hasModalCard: true,
      trapFocus: true,
      props: { account: this.account, token: token },
    });
  }

  openDonation(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: {
        account: this.account,
        inputAddress: "xch1kjllpsx4mz9gh36clzmzr69kze965almufz7vrch5xq3jymlsjjsysq7uh",
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

  async refresh(): Promise<void> {
    this.exchangeRate = await getExchangeRate(xchSymbol(), this.currencyName);
    store.dispatch("refreshBalance");
  }

  toggleDapp(): void {
    this.displayDapp = !this.displayDapp;
    localStorage.setItem("DISPLAY_DAPP", this.displayDapp.toString());
  }

  changePage(): void {
    document.getElementById("tab")?.scrollIntoView();
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

.w-3 {
  width: 3rem;
}
.rotate {
  animation: rotation 2s infinite linear;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}

.border-top-1 {
  border-top: 1px solid $grey-lighter;
}
</style>
