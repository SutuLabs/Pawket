<template>
  <div class="container">
    <div class="box has-text-centered" v-if="account && account.key">
      <section>
        <b-button @click="selectAccount()">{{ account.name }}: {{ account.key.fingerprint }}</b-button>
        <br />
        <span @click="copy(account.firstAddress)">{{account.firstAddress}} 📋</span>
        <div>
          <h2>
            {{ account.balance }} mojo
            <b-button size="is-small" @click="refreshBalance()">Refresh</b-button>
          </h2>
        </div>
      </section>
      <section>
        <b-button @click="showQr()" disabled>Receive</b-button>
        <b-button disabled>Send</b-button>
        <b-button @click="showExport()">Export</b-button>
      </section>
    </div>
    <div class="box">
      <b-tabs position="is-centered" class="block">
        <b-tab-item label="Asset">
          <a class="panel-block">
            <span class="panel-icon">₿</span>
            {{account.balance}} mojo
          </a>
          <a class="panel-block" v-for="asset in assets" :key="asset">
            <span class="panel-icon">₿</span>
            <span class="has-text-grey-light">0.0 {{ asset }}</span>
            <span class="has-text-grey" title="Not available to detect.">❔️</span>
          </a>
        </b-tab-item>
        <b-tab-item label="Activity">
          <a class="panel-block" v-for="(act,i) in account.activities" :key="i">
            <span class="panel-icon">🗒️</span>
            <span>{{act.coin.amount}} mojo</span>
            <span class="has-text-grey-light" v-if="act.spent">☑️ Used on {{act.spentBlockIndex}}</span>
            <span class="has-text-grey-light" v-if="act.coinbase">🌰️ Coinbase</span>
            <br />
            <span class="has-text-grey-light">⚡ {{act.confirmedBlockIndex}}</span>
            <span
              class="has-text-grey-light"
            >⏰ {{new Date(act.timestamp*1000).toISOString().slice(0,-5)}}</span>
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
import { Component, Prop, Vue } from "vue-property-decorator";
import store from "@/store";
import { generateMnemonic } from "bip39";
import utility from "../store/utility";
import { Account } from "@/store/index";
import AccountExport from "@/components/AccountExport.vue";
import AccountList from "@/components/AccountList.vue";
import { GetRecordsResponse } from "@/models/walletModel";
import KeyBox from "@/components/KeyBox.vue";

type Mode = "Verify" | "Create";

@Component({
  components: {
    KeyBox,
  },
})
export default class AccountDetail extends Vue {
  public balance = -1;
  public address = "xch1sdfhsghrghuier";
  public mode: Mode = "Verify";
  public assets = ["SBS", "CHB", "BSH"];

  get account(): Account {
    return store.state.accounts[store.state.selectedAccount] ?? {};
  }

  mounted() {
    this.mode = store.state.passwordHash ? "Verify" : "Create";
  }

  copy(text: string): void {
    store.dispatch("copy", text);
  }

  showExport() {
    this.$buefy.modal.open({
      parent: this,
      component: AccountExport,
      hasModalCard: true,
      trapFocus: true,
      props: { account: this.account },
    });
  }

  selectAccount() {
    this.$buefy.modal.open({
      parent: this,
      component: AccountList,
      hasModalCard: true,
      trapFocus: true,
      props: {},
    });
  }

  showQr() {
    this.$buefy.modal.open({
      parent: this,
      component: AccountExport,
      hasModalCard: true,
      trapFocus: true,
      props: { account: this.account },
    });
  }

  async refreshBalance() {
    store.dispatch("refreshBalance");
  }
}
</script>

<style scoped lang="scss"></style>
