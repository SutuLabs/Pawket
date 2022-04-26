<template>
  <div class="column is-8 is-offset-2">
    <div class="container px-4">
      <b-loading :is-full-page="true" :active="!account.tokens"></b-loading>
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
          <b-button class="is-pulled-right" @click="selectAccount()">{{ account.name }}: {{ account.key.fingerprint }}</b-button>
          <br />
          <div class="mt-5">
            <h2 class="is-size-3 py-5">
              <span v-if="account.tokens && account.tokens.hasOwnProperty('XCH')" class="pl-4">
                {{ account.tokens["XCH"].amount | demojo(null, 6) }}
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
              <span v-else>- XCH</span>
            </h2>
          </div>
          <div class="b-tooltip mx-5">
            <a @click="openLink(account.tokens['XCH'])" href="javascript:void(0)" class="has-text-primary">
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
          <b-button v-if="debugMode" @click="showExport()">{{ $t("accountDetail.ui.button.export") }}</b-button>
        </section>
      </div>
    </div>
    <div class="p-2">
      <b-tabs position="is-centered" class="block" expanded>
        <b-tab-item :label="$t('accountDetail.ui.tab.asset')">
          <a class="panel-block is-justify-content-space-between py-4" v-for="cat of tokenList" :key="cat.id">
            <span class="is-pulled-right" v-if="account.tokens && account.tokens.hasOwnProperty(cat.name)">
              <span class="panel-icon"></span>
              <span class="" v-if="tokenInfo[cat.name]">{{ account.tokens[cat.name].amount | demojo(tokenInfo[cat.name]) }}</span>
              <span class="has-text-grey-light is-size-7 pl-3" v-if="cat.name === 'XCH'">{{
                account.tokens[cat.name].amount | xchToCurrency(rate, currency)
              }}</span>
            </span>
            <a v-if="debugMode" class="is-pulled-right" href="javascript:void(0)" @click="openLink(account.tokens[cat.name])"
              >⚓</a
            >
          </a>
          <div class="column is-full has-text-centered">
            <a @click="addCat()"
              ><span class="has-color-link"
                ><b-icon icon="plus" size="is-small"></b-icon> {{ $t("accountDetail.ui.button.addToken") }}</span
              ></a
            >
          </div>
        </b-tab-item>
        <b-tab-item :label="$t('accountDetail.ui.tab.utxos')">
          <utxo :tokenInfo="tokenInfo" v-model="account.activities"></utxo>
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="box">
      <h2 class="has-text-weight-bold is-size-4 pb-5">{{ $t("accountDetail.ui.dApps.title") }}</h2>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.donate')" position="is-right">
        <b-button @click="openDonation()" size="is-large">❤️</b-button>
      </b-tooltip>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.takeOffer')" position="is-right">
        <b-button v-if="experimentMode" @click="openTakeOffer()" size="is-large" class="ml-5">💱</b-button>
      </b-tooltip>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.makeOffer')" position="is-right">
        <b-button v-if="experimentMode" @click="openMakeOffer()" size="is-large" class="ml-5">💸</b-button>
      </b-tooltip>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.batchSend')" position="is-right">
        <b-button v-if="experimentMode" @click="openBatchSend()" size="is-large" class="ml-5">🏘️</b-button>
      </b-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import store from "@/store";
import AccountExport from "@/components/AccountExport.vue";
import AccountList from "@/components/AccountList.vue";
import AccountConfigure from "@/components/AccountConfigure.vue";
import AddToken from "@/components/AddToken.vue";
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
import Utxo from "@/components/Utxo.vue";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
    Send,
    Utxo,
  },
  filters: { demojo, xchToCurrency },
})
export default class AccountDetail extends Vue {
  public mode: Mode = "Verify";
  private exchangeRate = -1;

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get tokenList(): CustomCat[] {
    let list: CustomCat[] = [];
    for (let key in store.state.account.tokenInfo) {
      list.push({ name: store.state.account.tokenInfo[key].symbol, id: store.state.account.tokenInfo[key].id ?? "XCH" });
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

  mounted(): void {
    this.mode = store.state.vault.passwordHash ? "Verify" : "Create";
    this.refresh();
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
      canCancel: ["x"],
      props: { account: this.account },
      events: { refresh: this.refresh },
    });
  }

  addCat(): void {
    this.$buefy.modal.open({
      parent: this,
      component: AddToken,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
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

  async refresh(): Promise<void> {
    this.exchangeRate = await getExchangeRate("XCH", this.currencyName);
    store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss">
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
</style>
