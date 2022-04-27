<template>
  <section>
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
              <span v-if="!activity.spent" class="mr-2 is-size-7 has-text-info">{{ new Date(activity.timestamp * 1000).toISOString().slice(5, 10) }}</span>
            </b-tooltip>
            <span v-if="activity.spent" class="is-size-7 has-text-grey-light">{{ activity.spentBlockIndex }}</span>
            <span v-else class="is-size-7 has-text-grey-light">{{ activity.confirmedBlockIndex }}</span>
          </p>
        </div>
      </div>
      <div class="column has-text-right has-text-grey-dark is-5">
        <span v-if="tokenInfo[activity.symbol]" :class="activity.spent ? '' : 'has-text-primary'">
          {{ activity.spent ? "-" : "+" }}{{ activity.coin.amount | demojo(tokenInfo[activity.symbol]) }}</span
        >
      </div>
    </a>
    <b-pagination :total="total" v-model="current" :range-before="rangeBefore" :range-after="rangeAfter" :per-page="perPage">
    </b-pagination>
  </section>
</template>
<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { CoinRecord } from "@/models/wallet";
import { TokenInfo } from "@/store/modules/account";
import { Component, Prop, Vue } from "vue-property-decorator";
import UtxoDetail from "@/components/UtxoDetail.vue";

@Component({
  filters: { demojo },
})
export default class UtxoPanel extends Vue {
  @Prop() private value!: CoinRecord[];
  @Prop() private tokenInfo!: TokenInfo;
  @Prop({ default: 10 }) private perPage!: number;
  @Prop({ default: 1 }) private rangeBefore!: number;
  @Prop({ default: 1 }) private rangeAfter!: number;
  current = 1;

  showUtxo(activity: CoinRecord): void {
    this.$buefy.modal.open({
      parent: this,
      component: UtxoDetail,
      hasModalCard: true,
      trapFocus: true,
      canCancel: ["x"],
      props: { activity: activity, tokenInfo: this.tokenInfo },
    });
  }

  get actList(): CoinRecord[] {
    const actList: CoinRecord[] = [];
    for (let act of this.value) {
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
}
</script>
<style scoped lang="scss">
.has-text-right {
  text-align: right;
}
</style>
