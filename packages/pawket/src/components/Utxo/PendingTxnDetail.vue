<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <span class="modal-card-title has-text-dark is-size-5"
        >{{ $t("utxoDetail.ui.title.cost")
        }}<span class="mx-2 tag is-danger is-light">{{ $t("utxoDetail.ui.label.pending") }}</span>
      </span>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('utxoDetail.ui.label.amount')" custom-class="is-medium has-text-weight-normal">
        <span class="has-text-grey is-size-5 has-text-left">
          <p v-for="(amount, symbol) of pendingTransaction.amount" :key="symbol">{{ demojo(amount, tokenInfo[symbol]) }}</p>
        </span>
      </b-field>
      <b-field :label="$t('utxoDetail.ui.label.time')" custom-class="is-medium has-text-weight-normal">
        <p class="has-text-grey">{{ new Date(pendingTransaction.time).toISOString() }}</p>
      </b-field>
      <b-field :label="$t('utxoDetail.ui.label.coins')" custom-class="is-medium has-text-weight-normal"> </b-field>
      <table class="table is-bordered table is-fullwidth">
        <thead>
          <tr class="has-text-centered">
            <th>{{ $t("utxoDetail.ui.label.coinName") }}</th>
            <th>{{ $t("utxoDetail.ui.label.amount") }}(mojos)</th>
            <th class="is-hidden-mobile">{{ $t("utxoDetail.ui.label.parentCoinInfo") }}</th>
            <th class="is-hidden-mobile">{{ $t("utxoDetail.ui.label.puzzleHash") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c of pendingTransaction.coin" :key="c.coinName">
            <td>
              <key-box :tooltip="$t('common.tooltip.copy')" :value="c.coinName" :showValue="true"></key-box>
            </td>
            <td class="is-size-7">
              <span class="tag is-primary is-light">{{ c.symbol }}</span>
              {{ c.coin.amount }}
            </td>
            <td class="is-hidden-mobile">
              <key-box :tooltip="$t('common.tooltip.copy')" :value="c.coin.parent_coin_info" :showValue="true"></key-box>
            </td>
            <td class="is-hidden-mobile">
              <key-box :tooltip="$t('common.tooltip.copy')" :value="c.coin.puzzle_hash" :showValue="true"></key-box>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="buttons">
        <button class="button is-outlined is-info is-fullwidth" @click="unlockCoins()">
          {{ $t("utxoDetail.ui.button.unlockCoins") }}
        </button>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { OneTokenInfo, TokenInfo } from "@/models/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle from "@/services/crypto/puzzle";
import { xchPrefix } from "@/store/modules/network";
import { PendingTransaction, unlockCoins } from "@/services/coin/coinUtility";

@Component({
  components: {
    KeyBox,
  },
})
export default class PendingTxnDetail extends Vue {
  @Prop() public pendingTransaction!: PendingTransaction;
  @Prop() public tokenInfo!: TokenInfo;
  public showDetail = false;

  @Emit("close")
  close(): void {
    return;
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  getAddressFromPuzzleHash(hash: string): string {
    return puzzle.getAddressFromPuzzleHash(hash, xchPrefix());
  }

  unlockCoins(): void {
    this.$buefy.dialog.confirm({
      message: this.$tc("utxoDetail.message.unlockCoins"),
      confirmText: this.$tc("common.button.confirm"),
      cancelText: this.$tc("common.button.cancel"),
      trapFocus: true,
      type: "is-danger",
      onConfirm: () => {
        const coins = this.pendingTransaction.coin.map((c) => c.coin);
        unlockCoins(coins);
        this.$emit("update")
        this.close();
      },
    });
  }
}
</script>
<style scoped lang="scss"></style>
