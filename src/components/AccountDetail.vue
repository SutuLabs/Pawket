<template>
  <div class="container">
    <div class="box has-text-centered" v-if="account && account.key">
      <section>
        <b-button class="is-pulled-right" @click="selectAccount()">{{ account.name }}: {{ account.key.fingerprint }}</b-button>
        <br />
        <div>
          <h2 class="is-size-3 py-5">
            <span v-if="account.tokens && account.tokens.hasOwnProperty('XCH')">{{ account.tokens["XCH"].amount | demojo }}</span>
            <span v-else>- mojo</span>
            <br />
            <b-button size="is-small" @click="refreshBalance()">Refresh</b-button>
          </h2>
        </div>
      </section>
      <section>
        <b-button @click="showQr()">Receive</b-button>
        <b-button disabled>Send</b-button>
        <!-- <b-button @click="showExport()">Export</b-button> -->
      </section>
    </div>
    <div class="box">
      <b-tabs position="is-centered" class="block">
        <b-tab-item label="Asset">
          <a class="panel-block is-justify-content-space-between" v-for="(token, symbol) in account.tokens" :key="symbol">
            <span class="is-pulled-right">
              <span class="panel-icon"></span>
              <span class="">{{ token.amount | demojo(tokenInfo[symbol].unit, tokenInfo[symbol].decimal) }}</span>
              <span class="has-text-grey-light is-size-7 pl-3">{{ token.amount }} mojo</span>
            </span>
            <a class="is-pulled-right" target="_blank" :href="'https://chia.tt/info/address/' + token.address">⚓</a>
          </a>
        </b-tab-item>
        <b-tab-item label="Activity">
          <a class="panel-block" v-for="(act, i) in account.activities" :key="i">
            <span class="panel-icon">🗒️</span>
            <span class="">{{ act.coin.amount | demojo(tokenInfo[act.symbol].unit, tokenInfo[act.symbol].decimal) }}</span>
            <span class="has-text-grey-light is-size-7 pl-3">{{ act.coin.amount }} mojo</span>
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
import store, { TokenInfo } from "@/store";
import { Account } from "@/store/index";
import AccountExport from "@/components/AccountExport.vue";
import AccountList from "@/components/AccountList.vue";
import KeyBox from "@/components/KeyBox.vue";
import Receive from "./Receive.vue";
import { demojo } from "@/services/filters";
type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo },
})
export default class AccountDetail extends Vue {
  public mode: Mode = "Verify";
  public assets = ["SBS", "CHB", "BSH"];

  get tokenInfo(): TokenInfo {
    return store.state.tokenInfo;
  }

  get account(): Account {
    return store.state.accounts[store.state.selectedAccount] ?? {};
  }

  mounted(): void {
    this.mode = store.state.passwordHash ? "Verify" : "Create";
    store.dispatch("refreshBalance");
  }

  copy(text: string): void {
    store.dispatch("copy", text);
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

  async refreshBalance(): Promise<void> {
    store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss"></style>
