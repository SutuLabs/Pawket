<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile }">
      <div class="notification has-background-grey-dark has-text-centered has-text-info-light py-2" v-if="offline">
        {{ $t("accountDetail.message.notification.offline") }}
        {{ $t("accountDetail.message.notification.turnOffPrefix") }}
        <router-link :to="{ path: '/settings/general' }"> {{ $t("accountDetail.message.notification.turnOff") }}</router-link>
        {{ $t("accountDetail.message.notification.turnOffSuffix") }}
      </div>
      <div class="container">
        <div class="py-5 has-text-centered" v-if="account && account.key">
          <section>
            <div class="is-size-4 is-pulled-left">Frodo</div>
            <b-tooltip :label="$t('accountDetail.ui.tooltip.lock')" class="is-pulled-right is-hidden-mobile">
              <b-button @click="lock()" rounded class="border-less"
                ><b-icon icon="lock" class="has-text-grey"> </b-icon
              ></b-button>
            </b-tooltip>
            <b-button
              :class="{
                'has-text-primary': !offline && networkId == 'mainnet',
                'has-text-info': !offline && networkId == 'testnet10',
                'has-text-grey': offline,
                'is-pulled-right': true,
                'border-less': true,
                'pr-1': true,
              }"
              
              @click="$router.push('/home/accounts')"
              rounded
              ><span class="has-text-grey">{{ account.key.fingerprint }}</span></b-button
            >
            <network-selector class="is-pulled-left"></network-selector>
            <b-button @click="toggleTheme()" rounded class="is-pulled-left border-less is-hidden-mobile"
              ><b-icon icon="brightness-6" class="has-text-grey"> </b-icon
            ></b-button>
            <b-tooltip :label="$t('accountDetail.ui.tooltip.errorLog')" class="is-pulled-right">
              <b-button v-if="debugMode && hasError" @click="$router.push('/home/errorLog')"
                ><b-icon icon="bug" class="has-text-grey"> </b-icon
              ></b-button>
            </b-tooltip>
            <br />
            <div class="mt-6">
              <!--<figure class="image is-96x96 is-clickable" style="margin: auto" @click="$router.push('/home/accounts')">
                <img v-if="account.profilePic" class="is-rounded cover" :src="account.profilePic" />
                <img v-else class="is-rounded cover" src="@/assets/account-circle.svg" />
              </figure>-->
              <p class="pt-2">
                <span class="pl-5 is-size-5">{{ nameOmit(account.name) }}</span
                ><b-tooltip :label="$t('accountDetail.ui.tooltip.refresh')">
                  <a class="is-size-6" href="javascript:void(0)" @click="refresh()" :disabled="refreshing">
                    <b-icon
                      :icon="refreshing ? 'autorenew' : 'refresh'"
                      :class="refreshing ? 'rotate' : 'has-text-primary'"
                      custom-size="mdi-12px"
                    >
                    </b-icon>
                  </a>
                </b-tooltip>
              </p>
              <key-box icon="checkbox-multiple-blank-outline" :value="address" :showValue="true"></key-box>
            </div>
            <div class="pt-3">
              <div class="b-tooltip">
                <a @click="$router.push('/home/send')" href="javascript:void(0)" class="has-text-primary">
                  <div class="mr-3">
                    <span class="icon has-background-primary is-medium is-circle"
                      ><i class="mdi mdi-arrow-right mdi-24px has-text-white"></i
                    ></span>
                    <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.send") }}</p>
                  </div>
                </a>
              </div>
              <div class="b-tooltip">
                <a @click="$router.push('/home/receive')" href="javascript:void(0)" class="has-text-primary">
                  <div class="mx-3">
                    <span class="icon has-background-primary is-medium is-circle"
                      ><i class="mdi mdi-download mdi-24px has-text-white"></i
                    ></span>
                    <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.receive") }}</p>
                  </div>
                </a>
              </div>
              <div class="b-tooltip">
                <a @click="$router.push('/home/buy')" href="javascript:void(0)" class="has-text-primary">
                  <div class="mx-3">
                    <span class="icon has-background-primary is-medium is-circle"
                      ><i class="mdi mdi-credit-card-outline mdi-24px has-text-white"></i
                    ></span>
                    <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.buy") }}</p>
                  </div>
                </a>
              </div>
              <div class="b-tooltip">
                <a @click="$router.push('/home/scan')" href="javascript:void(0)" class="has-text-primary">
                  <div class="mr-3">
                    <span class="icon has-background-primary is-medium is-circle"
                      ><i class="mdi mdi-crop-free mdi-24px has-text-white"></i
                    ></span>
                    <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.scan") }}</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div id="tab"></div>
      <div class="p-2">
        <div class="tabs is-centered is-fullwidth">
          <ul>
            <router-link to="/home/asset" :label="$t('accountDetail.ui.tab.asset')" v-slot="{ navigate, isActive, href }" custom>
              <li :class="isActive ? 'is-active' : ''">
                <a @click="navigate" :href="href">{{ $t("accountDetail.ui.tab.asset") }}</a>
              </li>
            </router-link>
            <router-link to="/home/nft" :label="$t('accountDetail.ui.tab.nft')" v-slot="{ navigate, isActive, href }" custom>
              <li :class="isActive ? 'is-active' : ''">
                <a @click="navigate" :href="href">{{ $t("accountDetail.ui.tab.nft") }}</a>
              </li>
            </router-link>
            <router-link to="/home/did" :label="$t('accountDetail.ui.tab.did')" v-slot="{ navigate, isActive, href }" custom>
              <li :class="isActive ? 'is-active' : ''">
                <a @click="navigate" :href="href">{{ $t("accountDetail.ui.tab.did") }}</a>
              </li>
            </router-link>
            <router-link to="/home/utxos" :label="$t('accountDetail.ui.tab.utxos')" v-slot="{ navigate, isActive, href }" custom>
              <li :class="isActive ? 'is-active' : ''">
                <a @click="navigate" :href="href">{{ $t("accountDetail.ui.tab.utxos") }}</a>
              </li>
            </router-link>
          </ul>
        </div>
        <router-view></router-view>
      </div>
      <div class="p-4 border-top-1">
        <dapp :account="account" :tokenList="tokenList" class="pb-6"></dapp>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import store from "@/store";
import ManageCats from "@/components/Cat/ManageCats.vue";
import ExplorerLink from "@/components/Home/ExplorerLink.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import Send from "@/components/Send/Send.vue";
import { demojo } from "@/filters/unitConversion";
import { xchToCurrency } from "@/filters/usdtConversion";
import { TokenInfo, AccountEntity, CustomCat, OneTokenInfo, AccountToken } from "@/models/account";
import { getTokenInfo } from "@/services/view/cat";
import { getExchangeRate } from "@/services/exchange/rates";
import { CurrencyType } from "@/services/exchange/currencyType";
import { CoinRecord } from "@/models/wallet";
import { nameOmit } from "@/filters/nameConversion";
import { NotificationProgrammatic as Notification } from "buefy";
import { NetworkInfo, xchSymbol } from "@/store/modules/network";
import Dapp from "./Dapp.vue";
import ErrorLog from "@/components/ErrorLog/ErrorLog.vue";
import AccountManagement from "@/components/AccountManagement/AccountManagement.vue";
import { isMobile } from "@/services/view/responsive";
import AddressAccountQr from "./AddressAccountQr.vue";
import { getAllCats } from "@/store/modules/account";
import NetworkSelector from "./NetworkSelector.vue";
import Scan from "../Scan/Scan.vue";
import { GetExchangeRateResponse } from "@/models/api";
import BuyUSDS from "./BuyUSDS.vue";
import { AddressType } from "@/services/crypto/puzzle";

@Component({
  components: {
    KeyBox,
    Send,
    Dapp,
    NetworkSelector,
  },
})
export default class AccountDetail extends Vue {
  public exchangeRate: GetExchangeRateResponse | null = null;
  public showOfflineNotification = true;
  public timeoutId?: ReturnType<typeof setTimeout>;
  public activeTab = 0;
  //@Prop() public account!: AccountEntity;
  //public account2!: AccountEntity;
  //public address = ""; //"xch1uw04fu624yng2hajucpew4z4s9ryhdu527v6q78w2mn4qsp7pumsq0gzn5";
  public addressType: AddressType = "Observed";

  get address(): string | null {
    return this.account.tokens ? this.account.tokens[xchSymbol()].addresses[1].address : null;
  }

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  get networks(): NetworkInfo {
    return store.state.network.networks;
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get token(): AccountToken | null {
    return this.account.tokens ? this.account.tokens[xchSymbol()] : null;
  }
/*
  get token2(): AccountToken {
    return this.account2.tokens[xchSymbol()];
  }

  get addresses(): AccountTokenAddress[] {
    return this.token2.addresses.filter((a) => a.type == this.addressType);
  }*/

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

  get isMobile(): boolean {
    return isMobile();
  }

  get path(): string {
    return this.$route.path;
  }

  @Watch("path")
  onPathChange(): void {
    switch (this.path) {
      case "/home/cats":
        this.ManageCats();
        break;
      case "/home/accounts":
        this.selectAccount();
        break;
      case "/home/send":
        this.showSend();
        break;
      case "/home/scan":
        this.showScan();
        break;
      case "/home/receive":
        this.openLink();
        break;
      case "/home/buy":
        this.buy();
        break;
      case "/home/errorLog":
        this.openErrorLog();
        break;
      default:
        break;
    }
  }

  nameOmit(name: string, upperCase = false): string {
    return nameOmit(name, upperCase);
  }

  xchToCurrency(mojo: null | number | bigint, rate = -1, currency: CurrencyType = CurrencyType.USDT): string {
    return xchToCurrency(mojo, rate, currency);
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
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
    if (!this.exchangeRate) return -1;
    return this.exchangeRate.price;
  }

  get xchSymbol(): string {
    return xchSymbol();
  }

  get unlocked(): boolean {
    return store.state.vault.unlocked;
  }

  @Watch("unlocked")
  onUnlockedChange(): void {
    if (!this.unlocked && this.timeoutId) clearTimeout(this.timeoutId);
  }

  get offline(): boolean {
    return store.state.vault.offline;
  }

  handleModalClose(): void {
    if (this.path != "/home") this.$router.push("/home").catch(() => undefined);
  }

  mounted(): void {
    this.autoRefresh(60);
    //Vue.set(this, "address", this.addresses[0].address); // new
    //Vue.set(this, "address", this.addresses[0].address); // new
  }

  unmounted(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
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
    if (this.unlocked && this.path.startsWith("/home")) {
      this.timeoutId = setTimeout(() => this.autoRefresh(sec), 1000 * sec);
    }
  }

  lock(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("accountDetail.message.confirmation.lock"),
      confirmText: this.$tc("accountDetail.ui.button.confirm"),
      cancelText: this.$tc("accountDetail.ui.button.cancel"),
      trapFocus: true,
      onConfirm: () => {
        if (this.timeoutId) clearTimeout(this.timeoutId);
        store.dispatch("lock");
      },
    });
  }

  openErrorLog(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ErrorLog,
      onCancel: this.handleModalClose,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: ["outside"],
      events: { close: this.handleModalClose },
    });
  }

  ManageCats(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: ManageCats,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { account: this.account },
      events: { refresh: this.refresh, close: this.handleModalClose },
    });
  }

  selectAccount(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountManagement,
      trapFocus: true,
      onCancel: this.handleModalClose,
      width: 700,
      canCancel: ["outside", "escape"],
      fullScreen: isMobile(),
      props: {},
      events: { close: this.handleModalClose },
    });
  }

  showSend(): void {
    this.checkObserveMode();
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { account: this.account, rate: this.rate, currency: this.currency },
      events: { close: this.handleModalClose },
    });
  }

  showScan(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Scan,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: [""],
      props: { account: this.account },
      events: { close: this.handleModalClose },
    });
  }

  openLink(): void {
    const component = this.account.type == "Address" ? AddressAccountQr : ExplorerLink;
    this.$buefy.modal.open({
      parent: this,
      component: component,
      trapFocus: true,
      width: 700,
      canCancel: ["outside", "escape"],
      onCancel: this.handleModalClose,
      fullScreen: isMobile(),
      props: { account: this.account },
      events: { close: this.handleModalClose },
    });
  }

  buy():void {
    this.$buefy.modal.open({
      parent: this,
      component: BuyUSDS,
      trapFocus: true,
      width: 700,
      canCancel: ["outside", "escape"],
      onCancel: this.handleModalClose,
      fullScreen: isMobile(),
      props: { account: this.account },
      events: { close: this.handleModalClose },
    });
  }

  refresh(): void {
    store.dispatch("refreshBalance");
    this.refreshRate();
  }

  changePage(): void {
    document.getElementById("tab")?.scrollIntoView();
  }

  toggleTheme(): void {
    const activeTheme = localStorage.getItem("user-theme");
    if (activeTheme === "light-theme") {
      this.theme = "dark-theme";
    } else {
      this.theme = "light-theme";
    }
  }

  get theme(): string {
    return localStorage.getItem("user-theme") ?? "light-theme";
  }

  set theme(theme: string) {
    localStorage.setItem("user-theme", theme);
    document.documentElement.className = theme;
  }

  get test(): boolean {
    return window.location.hostname == "kitten.pawket.app";
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

.w-3 {
  width: 3.5rem;
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

.nav-box {
  max-width: 1000px;
  margin: auto;
}

.border-less {
  border: 0;
}

.cover {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.is-circle {
  border-radius: 50%;
}
</style>
