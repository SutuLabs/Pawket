<template>
  <section>
    <div>
      <div class="border-bottom my-4">{{ $t("utxo.ui.label.queue") }}({{ Object.keys(pendingTransactions).length }})</div>
      <a
        href="javascript:void(0)"
        v-for="(ptxn, key) of pendingTransactions"
        :key="key"
        class="panel-block columns is-mobile"
        @click="showPendingTxn(ptxn)"
      >
        <div class="column is-flex is-7">
          <div class="mr-2">
            <b-icon icon="arrow-right-circle-outline" size="is-medium" class="has-text-grey-light"> </b-icon>
          </div>
          <div>
            <p class="has-text-grey-dark is-size-6">{{ $t("utxo.ui.label.cost") }}</p>
            <p>
              <span class="has-text-danger is-size-7">{{ $t("utxoDetail.ui.label.pending") }}</span>
            </p>
          </div>
        </div>
        <div class="column has-text-right has-text-grey-dark is-5">
          <p v-for="(amount, symbol) of ptxn.amount" :key="symbol">{{ demojo(amount, tokenInfo[symbol]) }}</p>
        </div>
      </a>
    </div>
    <div>
      <div class="border-bottom my-4">{{ $t("utxo.ui.label.confirmed") }}</div>
      <p v-if="!currentActList.length" class="has-text-centered">{{ $t("utxo.ui.text.empty") }}</p>
      <a
        href="javascript:void(0)"
        v-for="(activity, i) of currentActList"
        :key="i"
        @click="showUtxo(activity)"
        class="panel-block columns is-mobile"
      >
        <div class="column is-flex is-7">
          <div class="mr-2">
            <b-icon v-if="activity.spent" icon="arrow-right-circle-outline" size="is-medium" class="has-text-grey-light"></b-icon>
            <b-icon v-else icon="arrow-left-circle-outline" size="is-medium" class="has-text-primary"></b-icon>
          </div>
          <div>
            <p v-if="activity.spent" class="has-text-grey-dark is-size-6">{{ $t("utxo.ui.label.cost") }}</p>
            <p v-else class="has-text-grey-dark is-size-6">{{ $t("utxo.ui.label.receive") }}</p>
            <p>
              <b-tooltip v-if="!activity.spent" :label="new Date(activity.timestamp * 1000).toISOString()">
                <span v-if="!activity.spent" class="mr-2 is-size-7 has-text-info">{{
                  new Date(activity.timestamp * 1000).toISOString().slice(5, 10)
                }}</span>
              </b-tooltip>
              <span v-if="activity.spent" class="is-size-7 has-text-grey-light">{{ activity.spentBlockIndex }}</span>
              <span v-else class="is-size-7 has-text-grey-light">{{ activity.confirmedBlockIndex }}</span>
            </p>
          </div>
        </div>
        <div class="column has-text-right has-text-grey-dark is-5">
          <span
            v-if="activity.coin && activity.symbol && tokenInfo[activity.symbol]"
            :class="activity.spent ? '' : 'has-text-primary'"
          >
            {{ activity.spent ? "-" : "+" }}{{ demojo(activity.coin.amount, tokenInfo[activity.symbol]) }}
          </span>
        </div>
      </a>
      <b-pagination
        :total="total"
        v-model="current"
        :range-before="rangeBefore"
        :range-after="rangeAfter"
        :per-page="perPage"
        @change="changePage"
      >
      </b-pagination>
    </div>
  </section>
</template>
<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { CoinRecord } from "@/models/wallet";
import { AccountEntity, OneTokenInfo, TokenInfo } from "@/models/account";
import { Component, Vue, Watch } from "vue-property-decorator";
import UtxoDetail from "@/components/Utxo/UtxoDetail.vue";
import { isMobile } from "@/services/view/responsive";
import { getTokenInfo } from "@/services/view/cat";
import store from "@/store";
import { getLockedCoinsFromLocalStorage, LockedCoin, PendingTransaction } from "@/services/coin/coinUtility";
import PendingTxnDetail from "./PendingTxnDetail.vue";
import { chainId, xchSymbol } from "@/store/modules/network";

@Component({})
export default class UtxoPanel extends Vue {
  public perPage = 10;
  public rangeBefore = 1;
  public rangeAfter = 1;
  public pendingTransactions: Record<number, PendingTransaction> = {};
  current = 1;

  showUtxo(activity: CoinRecord): void {
    this.$buefy.modal.open({
      parent: this,
      component: UtxoDetail,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: ["outside", "escape"],
      props: { activity: activity, tokenInfo: this.tokenInfo },
    });
  }

  showPendingTxn(ptxn: PendingTransaction): void {
    this.$buefy.modal.open({
      parent: this,
      component: PendingTxnDetail,
      hasModalCard: true,
      trapFocus: true,
      fullScreen: isMobile(),
      canCancel: ["outside", "escape"],
      props: { pendingTransaction: ptxn, tokenInfo: this.tokenInfo },
      events: { update: () => (this.pendingTransactions = this.getPendingTransactions()) },
    });
  }

  get activities(): CoinRecord[] {
    return this.account.activities ?? [];
  }

  @Watch("activities")
  onActsChange(): void {
    this.pendingTransactions = this.getPendingTransactions();
  }

  getPendingTransactions(): Record<number, PendingTransaction> {
    let lc: LockedCoin[] = getLockedCoinsFromLocalStorage();
    const accountFinger = store.state.account.accounts[store.state.account.selectedAccount].key.fingerprint;
    lc = lc.filter((l) => l.network == chainId() && l.accountFinger == accountFinger);

    const tx = lc.reduce((prev, curr) => {
      if (!prev[curr.transactionTime])
        prev[curr.transactionTime] = {
          coin: [],
          time: curr.transactionTime,
          network: curr.network,
          amount: {},
        };
      prev[curr.transactionTime].coin.push(curr);
      const symbol = curr.symbol ?? xchSymbol();
      if (!prev[curr.transactionTime].amount[symbol]) prev[curr.transactionTime].amount[symbol] = 0n;
      prev[curr.transactionTime].amount[symbol] += BigInt(curr.coin.amount);
      return prev;
    }, {} as Record<number, PendingTransaction>);
    return tx;
  }

  get tokenInfo(): TokenInfo {
    return getTokenInfo(this.account);
  }

  get selectedAccount(): number {
    return store.state.account.selectedAccount;
  }

  get account(): AccountEntity {
    return store.state.account.accounts[this.selectedAccount] ?? {};
  }

  get actList(): CoinRecord[] {
    const actList: CoinRecord[] = [];
    for (let act of this.activities) {
      actList.push(act);
      if (act.spent) {
        // generate original receive record
        const rAct: CoinRecord = JSON.parse(JSON.stringify(act));
        rAct.spent = false;
        rAct.spentBlockIndex = 0;
        actList.push(rAct);
      }
    }
    actList.sort((a, b) => {
      const aIndex = Math.max(a.confirmedBlockIndex, a.spentBlockIndex);
      const bIndex = Math.max(b.confirmedBlockIndex, b.spentBlockIndex);
      return bIndex - aIndex;
    });
    return actList;
  }

  get total(): number {
    return this.actList.length;
  }

  get currentActList(): CoinRecord[] {
    const start = this.perPage * (this.current - 1);
    const end = start + this.perPage;
    return this.actList.slice(start, end);
  }

  // eslint-disable-next-line
  changePage(value: number): void {
    this.$emit("changePage");
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  mounted(): void {
    this.pendingTransactions = this.getPendingTransactions();
  }
}
</script>
<style scoped lang="scss">
.has-text-right {
  text-align: right;
}

.border-bottom {
  border-bottom: 1px solid #dbdbdb;
}
</style>
