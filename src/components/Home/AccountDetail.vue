<template>
  <div class="column nav-box">
    <div :class="{ box: !isMobile }">
      <div class="notification has-background-grey-dark has-text-centered has-text-info-light py-2" v-if="offline">
        {{ $t("accountDetail.message.notification.offline") }}
      </div>
      <div class="container">
        <div class="py-5 has-text-centered" v-if="account && account.key">
          <section>
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
              icon-left="paw"
              @click="selectAccount()"
              rounded
              ><span class="has-text-grey">{{ account.key.fingerprint }}</span></b-button
            >
            <b-dropdown v-model="networkId" aria-role="list" :mobile-modal="false" class="is-pulled-left">
              <template #trigger>
                <b-button
                  :class="{
                    'has-text-primary': !offline && networkId == 'mainnet',
                    'has-text-info': !offline && networkId == 'testnet10',
                    'has-text-grey': offline,
                    'border-less': true,
                    'pl-2': true,
                  }"
                  icon-left="brightness-1"
                  icon-right="menu-down"
                  rounded
                  ><span class="has-text-grey">{{ networkId }}</span></b-button
                >
              </template>
              <b-dropdown-item v-for="net in networks" :key="net.name" :value="net.name" aria-role="listitem">{{
                net.name
              }}</b-dropdown-item>
            </b-dropdown>
            <b-tooltip :label="$t('accountDetail.ui.tooltip.errorLog')" class="is-pulled-right">
              <b-button v-if="debugMode && hasError" @click="openErrorLog()"
                ><b-icon icon="bug" class="has-text-grey"> </b-icon
              ></b-button>
            </b-tooltip>
            <br />
            <div class="mt-6">
              <figure class="image is-96x96 is-clickable" style="margin: auto" @click="selectAccount()">
                <img v-if="account.profilePic" class="is-rounded cover" :src="account.profilePic" />
                <img v-else class="is-rounded cover" src="@/assets/account-circle.svg" />
              </figure>
              <p class="pt-2">
                <span class="pl-5 is-size-4">{{ account.name | nameOmit }}</span
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
              <p v-if="account.tokens && account.tokens.hasOwnProperty('XCH')" class="is-size-6 pt-2 has-text-grey">
                {{ account.tokens["XCH"].amount | xchToCurrency(rate, currency) }}
              </p>
            </div>
            <div class="pt-3">
              <div class="b-tooltip">
                <a @click="openLink()" href="javascript:void(0)" class="has-text-primary">
                  <div class="mx-5">
                    <b-icon icon="download-circle" size="is-medium"> </b-icon>
                    <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.receive") }}</p>
                  </div>
                </a>
              </div>
              <div class="b-tooltip">
                <a @click="showSend()" href="javascript:void(0)" class="has-text-primary">
                  <div class="mr-5">
                    <b-icon icon="arrow-right-circle" size="is-medium"> </b-icon>
                    <p class="is-size-6 w-3">{{ $t("accountDetail.ui.button.send") }}</p>
                  </div>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
      <div id="tab"></div>
      <div class="p-2">
        <b-tabs position="is-centered" class="block" expanded>
          <b-tab-item :label="$t('accountDetail.ui.tab.asset')" class="min-height-20">
            <a
              v-for="cat of tokenList"
              :key="cat.id"
              class="panel-block is-justify-content-space-between py-4 has-text-grey-dark"
              v-show="account.tokens && account.tokens.hasOwnProperty(cat.name)"
            >
              <div class="column is-flex is-7" v-if="account.tokens && account.tokens.hasOwnProperty(cat.name)">
                <div class="mr-4">
                  <span class="image is-32x32">
                    <img v-if="cat.img" class="is-rounded" :src="cat.img" />
                    <img v-else-if="cat.name === xchSymbol" class="is-rounded" src="@/assets/chia-logo.svg" />
                    <img v-else class="is-rounded" src="@/assets/custom-cat.svg" />
                  </span>
                </div>
                <div class="py-1">
                  <p class="has-text-grey-dark is-size-6" v-if="tokenInfo[cat.name]">
                    <span v-if="account.tokens[cat.name].amount < 0">- {{ cat.name }}</span>
                    <span v-else>{{ account.tokens[cat.name].amount | demojo(tokenInfo[cat.name]) }}</span>
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
          <b-tab-item :label="$t('accountDetail.ui.tab.nft')" class="min-height-20">
            <nft-panel :account="account" @changePage="changePage"></nft-panel>
          </b-tab-item>
          <b-tab-item :label="$t('accountDetail.ui.tab.did')" class="min-height-20" v-if="debugMode">
            <did></did>
          </b-tab-item>
          <b-tab-item :label="$t('accountDetail.ui.tab.utxos')" class="min-height-20">
            <utxo-panel :tokenInfo="tokenInfo" v-model="activities" @changePage="changePage"></utxo-panel>
          </b-tab-item>
        </b-tabs>
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
import AccountInfo from "@/components/AccountManagement/AccountInfo.vue";
import ManageCats from "@/components/Cat/ManageCats.vue";
import ExplorerLink from "@/components/Home/ExplorerLink.vue";
import KeyBox from "@/components/Common/KeyBox.vue";
import Send from "@/components/Send/Send.vue";
import Did from "@/components/Did/Did.vue";
import { demojo } from "@/filters/unitConversion";
import { xchToCurrency } from "@/filters/usdtConversion";
import { TokenInfo, AccountEntity, CustomCat } from "@/models/account";
import { getTokenInfo } from "@/services/view/cat";
import { getExchangeRate } from "@/services/exchange/rates";
import { CurrencyType } from "@/services/exchange/currencyType";
import UtxoPanel from "@/components/Utxo/UtxoPanel.vue";
import { CoinRecord } from "@/models/wallet";
import { nameOmit } from "@/filters/nameConversion";
import { NotificationProgrammatic as Notification } from "buefy";
import { NetworkInfo, xchSymbol } from "@/store/modules/network";
import NftPanel from "@/components/Nft/NftPanel.vue";
import DidPanel from "@/components/Did/DidPanel.vue";
import Dapp from "./Dapp.vue";
import ErrorLog from "@/components/ErrorLog/ErrorLog.vue";
import AccountManagement from "@/components/AccountManagement/AccountManagement.vue";
import { isMobile } from "@/services/view/responsive";
import AddressAccountQr from "./AddressAccountQr.vue";
import { getAllCats } from "@/store/modules/account";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
    Send,
    UtxoPanel,
    NftPanel,
    DidPanel,
    Dapp,
    Did,
  },
  filters: { demojo, xchToCurrency, nameOmit },
})
export default class AccountDetail extends Vue {
  public mode: Mode = "Verify";
  private exchangeRate = -1;
  public showOfflineNotification = true;
  public timeoutId?: ReturnType<typeof setTimeout>;

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get networkId(): string {
    return store.state.network.networkId;
  }

  set networkId(value: string) {
    store.dispatch("switchNetwork", value);
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

  get offline(): boolean {
    return store.state.account.offline;
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
        if (this.timeoutId) clearTimeout(this.timeoutId);
        store.dispatch("lock");
      },
    });
  }

  showExport(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountInfo,
      hasModalCard: true,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { idx: this.selectedAccount },
    });
  }

  openErrorLog(): void {
    this.$buefy.modal.open({
      parent: this,
      component: ErrorLog,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: ["outside"],
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
      events: { refresh: this.refresh },
    });
  }

  selectAccount(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AccountManagement,
      trapFocus: true,
      canCancel: ["outside"],
      fullScreen: isMobile(),
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
      fullScreen: isMobile(),
      canCancel: [""],
      props: { account: this.account, rate: this.rate, currency: this.currency },
    });
  }

  openLink(): void {
    const component = this.account.type == "Address" ? AddressAccountQr : ExplorerLink;
    this.$buefy.modal.open({
      parent: this,
      component: component,
      trapFocus: true,
      canCancel: [""],
      fullScreen: isMobile(),
      props: { account: this.account },
    });
  }

  async refresh(): Promise<void> {
    this.refreshRate();
    await store.dispatch("refreshBalance");
  }

  changePage(): void {
    document.getElementById("tab")?.scrollIntoView();
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

.min-height-20 {
  min-height: 20vh;
}

.border-less {
  border: 0;
}

.cover {
  height: 100%;
  width: 100%;
  object-fit: cover;
}
</style>
