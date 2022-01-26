<template>
  <div class="container">
    <div class="box has-text-centered" v-if="account && account.key">
      <section>
        <b-button @click="selectAccount()"
          >{{ account.name }}: {{ account.key.fingerprint }}</b-button
        >
        <br />
        <!-- <span @click="copy(address)">{{address}} 📋</span> -->
        <div>
          <h2>{{ balance }}</h2>
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
          <a class="panel-block" v-for="asset in assets" :key="asset">
            <span class="panel-icon">₿</span>
            0.0 {{ asset }}
          </a>
        </b-tab-item>
        <b-tab-item label="Activity"></b-tab-item>
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

type Mode = "Verify" | "Create";

@Component
export default class AccountDetail extends Vue {
  public balance = "0.0 XCH";
  public address = "xch1sdfhsghrghuier";
  public mode: Mode = "Verify";
  public assets = ["XCH", "SBS", "CHB", "BSH"];

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
}
</script>

<style scoped lang="scss"></style>
