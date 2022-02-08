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
              Refresh
              <b-loading :is-full-page="false" v-model="refreshing"></b-loading>
            </b-button>
          </h2>
        </div>
      </section>
      <section>
        <b-button @click="openLink(account.tokens['XCH'])">Receive</b-button>
        <b-button :disabled="!debugMode" @click="showSend()">Send</b-button>
        <b-button v-if="debugMode" @click="showExport()">Export</b-button>
      </section>
    </div>
    <div class="box">
      <b-tabs position="is-centered" class="block">
        <b-tab-item label="Asset">
          <a class="panel-block is-justify-content-space-between" v-for="(token, symbol) in account.tokens" :key="symbol">
            <span class="is-pulled-right">
              <span class="panel-icon"></span>
              <span class="">{{ token.amount | demojo(tokenInfo[symbol].unit, tokenInfo[symbol].decimal) }}</span>
              <span class="has-text-grey-light is-size-7 pl-3">{{ token.amount }} mojos</span>
            </span>
            <a class="is-pulled-right" href="javascript:void(0)" @click="openLink(token)">⚓</a>
          </a>
        </b-tab-item>
        <b-tab-item label="Activity">
          <a class="panel-block" v-for="(act, i) in account.activities" :key="i">
            <span class="panel-icon">🗒️</span>
            <span class="">{{ act.coin.amount | demojo(tokenInfo[act.symbol].unit, tokenInfo[act.symbol].decimal) }}</span>
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
import Receive from "./Receive.vue";
import Send from "./Send.vue";
import { demojo } from "@/filters/unitConversion";
import { TokenInfo, Account, AccountToken } from '@/store/modules/account';

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
  public tokenInfo: TokenInfo = {};

  get refreshing(): boolean {
    return store.state.account.refreshing;
  }

  get account(): Account {
    return store.state.account.accounts[store.state.account.selectedAccount] ?? {};
  }

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  mounted(): void {
    this.mode = store.state.vault.passwordHash ? "Verify" : "Create";
    this.tokenInfo = Object.assign({}, store.state.account.tokenInfo);
    if (this.account.cats) {
      for (let i = 0; i < this.account.cats.length; i++) {
        const cat = this.account.cats[i];
        this.tokenInfo[cat.name] = {
          id: cat.id,
          symbol: cat.name,
          decimal: 3,
          unit: cat.name,
        };
      }
    }
    store.dispatch("refreshBalance");
  }

  lock(): void {
    this.$buefy.dialog.confirm({
      message: `Lock?`,
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

  showQr(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Receive,
      hasModalCard: true,
      trapFocus: true,
      props: { account: this.account },
    });
  }

  showSend(): void {
    this.$buefy.modal.open({
      parent: this,
      component: Send,
      hasModalCard: true,
      trapFocus: true,
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

  async refreshBalance(): Promise<void> {
    store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss"></style>
