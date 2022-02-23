<template>
  <div class="container">
    <div class="box has-text-centered" v-if="account && account.key">
      <section>
        <b-button class="is-pulled-left" @click="configureAccount()">⚙️</b-button>
        <b-button class="is-pulled-right" @click="lock()">🔒</b-button>
        <b-button class="is-pulled-right" @click="selectAccount()">{{ account.name }}: {{ account.key.fingerprint }}</b-button>
        <br />
        <div>
          <h2 class="is-size-3 py-5">
            <span v-if="account.tokens && account.tokens.hasOwnProperty('XCH')">
              {{ account.tokens["XCH"].amount | demojo }}
              <a class="is-size-6" href="javascript:void(0)" @click="openLink(account.tokens['XCH'])">⚓</a>
            </span>
            <span v-else>- XCH</span>
            <br />
            <b-button size="is-small" @click="refreshBalance()" :disabled="refreshing">
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
          <a class="panel-block is-justify-content-space-between" v-for="(token, symbol) in account.tokens" :key="symbol">
            <span class="is-pulled-right">
              <span class="panel-icon"></span>
              <span class="" v-if="tokenInfo[symbol]">{{
                token.amount | demojo(tokenInfo[symbol].unit, tokenInfo[symbol].decimal)
              }}</span>
              <span class="has-text-grey-light is-size-7 pl-3">{{ token.amount }} mojos</span>
            </span>
            <a class="is-pulled-right" href="javascript:void(0)" @click="openLink(token)">⚓</a>
          </a>
        </b-tab-item>
        <b-tab-item :label="$t('accountDetail.ui.tab.activity')">
          <a class="panel-block" v-for="(act, i) in account.activities" :key="i">
            <span class="panel-icon">🗒️</span>
            <span class="" v-if="tokenInfo[act.symbol]">{{
              act.coin.amount | demojo(tokenInfo[act.symbol].unit, tokenInfo[act.symbol].decimal)
            }}</span>
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
    <div class="box">
      <h2 class="has-text-weight-bold is-size-4 pb-5">{{ $t('accountDetail.ui.title.dApps')}}</h2>
      <b-tooltip :label="$t('accountDetail.ui.tooltip.donate')" multilined position="is-right">
        <b-button @click="openDonation()" size="is-large">❤️</b-button>
      </b-tooltip>
      <b-tooltip v-if="debugMode" :label="$t('accountDetail.ui.tooltip.offer')" multilined position="is-right">
        <b-button @click="openOfferManagement()" size="is-large" class="mx-5">💱</b-button>
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
import ExplorerLink from "@/components/ExplorerLink.vue";
import KeyBox from "@/components/KeyBox.vue";
import Send from "./Send.vue";
import { demojo } from "@/filters/unitConversion";
import { TokenInfo, AccountEntity, AccountToken } from "@/store/modules/account";
import { translate } from "@/i18n/i18n";
import OfferManagement from './OfferManagement.vue';

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
  public assets = ["SBS", "CHB", "BSH"];

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get tokenInfo(): TokenInfo {
    const tokenInfo = Object.assign({}, store.state.account.tokenInfo);
    if (this.account.cats) {
      for (let i = 0; i < this.account.cats.length; i++) {
        const cat = this.account.cats[i];
        tokenInfo[cat.name] = {
          id: cat.id,
          symbol: cat.name,
          decimal: 3,
          unit: cat.name,
        };
      }
    }

    return tokenInfo;
  }

  mounted(): void {
    this.mode = store.state.vault.passwordHash ? "Verify" : "Create";
    store.dispatch("refreshBalance");
  }

  lock(): void {
    this.$buefy.dialog.confirm({
      message: translate("accountDetail.message.confirmation.lock"),
      confirmText: translate("accountDetail.ui.button.confirm"),
      cancelText: translate("accountDetail.ui.button.cancel"),
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
      props: { account: this.account },
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
      canCancel: ['x'],
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
      canCancel: ['x'],
      props: {
        account: this.account,
        inputAddress: "xch1kjllpsx4mz9gh36clzmzr69kze965almufz7vrch5xq3jymlsjjsysq7uh",
        addressEditable: false,
        notificationMessage: translate("accountDetail.message.notification.donate"),
        notificationIcon: "hand-heart",
        notificationClosable: false,
        notificationType: "is-success",
      },
    });
  }

  openOfferManagement(): void {
    this.$buefy.modal.open({
      parent: this,
      component: OfferManagement,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ['x'],
      props: {
        account: this.account,
      },
    });
  }

  async refreshBalance(): Promise<void> {
    store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss"></style>
