<template>
  <div class="container">
    <div class="box has-text-centered" v-if="account && account.key">
      <section>
        <b-tooltip :label="$t('accountDetail.ui.tooltip.setting')" class="is-pulled-left">
          <b-button @click="configureAccount()">
            <b-icon icon="cog"> </b-icon>
          </b-button>
        </b-tooltip>
        <b-tooltip :label="$t('accountDetail.ui.tooltip.lock')" class="is-pulled-right">
          <b-button @click="lock()"><b-icon icon="lock"> </b-icon></b-button>
        </b-tooltip>
        <b-button class="is-pulled-right" @click="selectAccount()">{{ account.name }}: {{ account.key.fingerprint }}</b-button>
        <br />
        <div>
          <h2 class="is-size-3 py-5">
            <span v-if="account.tokens && account.tokens.hasOwnProperty('XCH')">
              {{ account.tokens["XCH"].amount | demojo(null, 6) }}
              <b-tooltip :label="$t('accountDetail.ui.tooltip.address')">
                <a class="is-size-6" href="javascript:void(0)" @click="openLink(account.tokens['XCH'])">
                  <b-icon icon="qrcode"> </b-icon>
                </a>
              </b-tooltip>
            </span>
            <span v-else>- XCH</span>
            <br />
            <b-button size="is-small" @click="refresh()" :disabled="refreshing">
              {{ $t("accountDetail.ui.button.refresh") }}
              <b-loading :is-full-page="false" v-model="refreshing"></b-loading>
            </b-button>
          </h2>
        </div>
      </section>
      <section>
        <b-button @click="openLink(account.tokens['XCH'])">{{ $t("accountDetail.ui.button.receive") }}</b-button>
        <b-button @click="showSend()">{{ $t("accountDetail.ui.button.send") }}</b-button>
        <b-button v-if="debugMode" @click="showExport()">{{ $t("accountDetail.ui.button.export") }}</b-button>
      </section>
    </div>
    <div class="box">
      <b-tabs position="is-centered" class="block">
        <b-tab-item :label="$t('accountDetail.ui.tab.asset')">
          <a class="panel-block is-justify-content-space-between" v-for="cat of tokenList" :key="cat.id">
            <span class="is-pulled-right" v-if="account.tokens && account.tokens.hasOwnProperty(cat.name)">
              <span class="panel-icon"></span>
              <span class="" v-if="tokenInfo[cat.name]">{{ account.tokens[cat.name].amount | demojo(tokenInfo[cat.name]) }}</span>
              <span class="has-text-grey-light is-size-7 pl-3">{{ account.tokens[cat.name].amount }} mojos</span>
            </span>
            <a v-if="debugMode" class="is-pulled-right" href="javascript:void(0)" @click="openLink(account.tokens[cat.name])"
              >⚓</a
            >
          </a>
        </b-tab-item>
        <b-tab-item :label="$t('accountDetail.ui.tab.activity')">
          <a class="panel-block" v-for="(act, i) in account.activities" :key="i">
            <span class="panel-icon">🗒️</span>
            <span class="" v-if="tokenInfo[act.symbol]">{{ act.coin.amount | demojo(tokenInfo[act.symbol]) }}</span>
            <span class="has-text-grey-light is-size-7 pl-3">{{ act.coin.amount }} mojos</span>
            <span class="has-text-grey-light" v-if="act.spent">☑️ Used on {{ act.spentBlockIndex }}</span>
            <span class="has-text-grey-light" v-if="act.coinbase">🌰️ Coinbase</span>
            <br />
            <span class="has-text-grey-light">⚡ {{ act.confirmedBlockIndex }}</span>
            <span class="has-text-grey-light">⏰ {{ new Date(act.timestamp * 1000).toISOString().slice(0, -5) }}</span>
            <br />
            <span>
              <key-box :value="act.coin.parentCoinInfo" display="ParentCoinInfo"></key-box>
              <key-box :value="act.coin.puzzleHash" display="PuzzleHash"></key-box>
            </span>
          </a>
        </b-tab-item>
      </b-tabs>
    </div>
    <div class="column is-full has-text-centered">
      <a @click="addCat()"
        ><span><b-icon icon="plus" size="is-small"></b-icon> {{ $t("accountDetail.ui.button.addToken") }}</span></a
      >
    </div>
    <div class="box">
      <h2 class="has-text-weight-bold is-size-4 pb-5">{{ $t("accountDetail.ui.dApps.title") }}</h2>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.donate')" multilined position="is-right">
        <b-button @click="openDonation()" size="is-large">❤️</b-button>
      </b-tooltip>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.takeOffer')" multilined position="is-right">
        <b-button v-if="experimentMode" @click="openTakeOffer()" size="is-large" class="ml-5">💱</b-button>
      </b-tooltip>
      <b-tooltip :label="$t('accountDetail.ui.dApps.tooltip.makeOffer')" multilined position="is-right">
        <b-button v-if="experimentMode" @click="openMakeOffer()" size="is-large" class="ml-5">💸</b-button>
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
import { TokenInfo, AccountEntity, AccountToken, CustomCat, defaultCats } from "@/store/modules/account";
import TakeOffer from "./Offer/Take.vue";
import MakeOffer from "./Offer/Make.vue";
import { getTokenInfo } from "@/services/coin/cat";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
    Send,
  },
  filters: { demojo },
})
export default class AccountDetail extends Vue {
  public mode: Mode = "Verify";

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get tokenList(): CustomCat[] {
    return [{ name: "XCH", id: "XCH" }, ...defaultCats, ...this.account.cats];
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get experimentMode(): boolean {
    return store.state.vault.experiment;
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
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
      props: { account: this.account },
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
        notificationType: "is-success",
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

  async refresh(): Promise<void> {
    store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss"></style>
