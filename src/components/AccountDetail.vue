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
          <b-tooltip :label="$t('accountDetail.ui.tooltip.errorLog')" class="is-pulled-right">
            <b-button v-if="debugMode && hasError" @click="openErrorLog()"
              ><b-icon icon="bug" class="has-text-grey"> </b-icon
            ></b-button>
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
          <a
            v-for="cat of tokenList"
            :key="cat.id"
            class="panel-block is-justify-content-space-between py-4 has-text-grey-dark"
            v-show="account.tokens && account.tokens.hasOwnProperty(cat.name)"
          >
            <div class="column is-flex is-7" v-if="account.tokens && account.tokens.hasOwnProperty(cat.name)">
              <div class="mr-2">
                <span class="image is-32x32">
                  <img v-if="cat.img" class="is-rounded" :src="cat.img" />
                  <img v-else-if="cat.name === xchSymbol" src="@/assets/chia-logo.svg" />
                  <jazzicon v-else :diameter="32" :address="cat.id"></jazzicon>
                </span>
              </div>
              <div class="py-1">
                <p class="has-text-grey-dark is-size-6" v-if="tokenInfo[cat.name]">
                  {{ account.tokens[cat.name].amount | demojo(tokenInfo[cat.name]) }}
                </p>
                <p>
                  <span class="mr-2 is-size-7 has-text-grey" v-if="cat.name === xchSymbol">{{
                    account.tokens[cat.name].amount | xchToCurrency(rate, currency)
                  }}</span>
                </p>
              </div>
            </div>
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
        <b-tab-item v-if="experimentMode && testnet" :label="$t('accountDetail.ui.tab.nft')" :visible="debugMode">
          <nft-panel :account="account" @changePage="changePage"></nft-panel>
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="p-4 border-top-1">
      <dapp :account="account" :tokenList="tokenList"></dapp>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import AccountExport from "@/components/AccountExport.vue";
import AccountList from "@/components/AccountList.vue";
import AccountConfigure from "@/components/AccountConfigure.vue";
import ManageCats from "@/components/ManageCats.vue";
import ExplorerLink from "@/components/ExplorerLink.vue";
import KeyBox from "@/components/KeyBox.vue";
import Jazzicon from "vue3-jazzicon/src/components/Jazzicon.vue";
import Send from "./Send.vue";
import { demojo } from "@/filters/unitConversion";
import { xchToCurrency } from "@/filters/usdtConversion";
import { TokenInfo, AccountEntity, AccountToken, CustomCat, getAllCats } from "@/store/modules/account";
import { getTokenInfo } from "@/services/coin/cat";
import { getExchangeRate } from "@/services/exchange/rates";
import { CurrencyType } from "@/services/exchange/currencyType";
import UtxoPanel from "@/components/UtxoPanel.vue";
import { CoinRecord } from "@/models/wallet";
import { nameOmit } from "@/filters/nameConversion";
import { NotificationProgrammatic as Notification } from "buefy";
import { xchSymbol } from "@/store/modules/network";
import NftPanel from "@/components/Detail/NftPanel.vue";
import Dapp from "./Dapp.vue";
import ErrorLog from "./ErrorLog.vue";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
    Send,
    UtxoPanel,
    NftPanel,
    Dapp,
    Jazzicon,
  },
  filters: { demojo, xchToCurrency, nameOmit },
})
export default class AccountDetail extends Vue {
  public mode: Mode = "Verify";
  private exchangeRate = -1;
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
    return getAllCats(this.account);
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get hasError(): boolean {
    return store.state.error.errorLogs.length > 0;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get observeMode(): boolean {
    return this.account.type == "Address";
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

  get testnet(): boolean {
    return store.state.network.networkId == "testnet10";
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
    this.autoRefresh(60);
  }

  unmounted(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  @Watch("xchSymbol")
  onNetworkChange(): void {
    this.refresh();
  }

  async refreshRate(): Promise<void> {
    this.exchangeRate = await getExchangeRate(xchSymbol(), this.currencyName);
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
      canCancel: [""],
      props: { account: this.account },
    });
  }

  openErrorLog(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ErrorLog,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["outside"],
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
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { account: this.account },
      events: { refresh: this.refresh },
    });
  }

  selectAccount(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountList,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: {},
    });
  }

  showSend(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      props: { account: this.account, rate: this.rate, currency: this.currency },
    });
  }

  openLink(token: AccountToken): void {
    this.$buefy.modal.open({
      parent: this,
      component: ExplorerLink,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["outside"],
      props: { account: this.account, token: token },
    });
  }

  async refresh(): Promise<void> {
    this.refreshRate();
    store.dispatch("refreshBalance");
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
