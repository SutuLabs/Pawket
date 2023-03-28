<template>
  <div class="modal-card">
    <top-bar v-if="activity.spent" :title="$t('utxoDetail.ui.title.cost')" @close="close()" :showClose="true"></top-bar>
    <top-bar v-else :title="$t('utxoDetail.ui.title.receive')" @close="close()" :showClose="true"></top-bar>
    <section class="modal-card-body">
      <b-field :label="$t('utxoDetail.ui.label.amount')" custom-class="is-medium has-text-weight-normal">
        <span
          v-if="activity.coin && activity.symbol && tokenInfo[activity.symbol]"
          class="has-text-dark is-size-5 has-text-right"
        >
          {{ activity.spent ? "-" : "+" }}{{ demojo(activity.coin.amount, tokenInfo[activity.symbol]) }}
          <span class="has-text-grey is-size-7">{{ activity.coin.amount }} mojos</span>
        </span>
      </b-field>
      <b-field :label="$t('utxoDetail.ui.label.time')" custom-class="is-medium has-text-weight-normal">
        <p class="has-text-grey">{{ new Date(activity.timestamp * 1000).toISOString() }}</p>
      </b-field>
      <b-field
        custom-class="is-medium has-text-weight-normal"
        v-if="activity.spent"
        :label="$t('utxoDetail.ui.label.spentHeight')"
      >
        <p class="has-text-grey">{{ activity.spentBlockIndex }}</p>
      </b-field>
      <b-field custom-class="is-medium has-text-weight-normal" :label="$t('utxoDetail.ui.label.confirmedHeight')">
        <p class="has-text-grey">{{ activity.confirmedBlockIndex }}</p>
      </b-field>
      <b-field
        :label="$t('utxoDetail.ui.label.parentCoinInfo')"
        custom-class="is-medium has-text-weight-normal"
        v-if="activity.coin"
      >
        <p class="long-text-wrapper has-text-grey">
          {{ activity.coin.parentCoinInfo }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('utxoDetail.ui.tooltip.copy')"
            :value="activity.coin.parentCoinInfo"
          ></key-box>
        </p>
      </b-field>
      <b-field :label="$t('utxoDetail.ui.label.puzzleHash')" custom-class="is-medium has-text-weight-normal" v-if="activity.coin">
        <p class="long-text-wrapper has-text-grey">
          {{ getAddressFromPuzzleHash(activity.coin.puzzleHash) }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('utxoDetail.ui.tooltip.copy')"
            :value="getAddressFromPuzzleHash(activity.coin.puzzleHash)"
          ></key-box>
        </p>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { CoinRecord } from "@/models/wallet";
import { OneTokenInfo, TokenInfo } from "@/models/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle from "@/services/crypto/puzzle";
import { xchPrefix } from "@/store/modules/network";
import TopBar from "../Common/TopBar.vue";

@Component({
  components: {
    KeyBox,
    TopBar,
  },
})
export default class UtxoDetail extends Vue {
  @Prop() public activity!: CoinRecord;
  @Prop() public tokenInfo!: TokenInfo;

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
}
</script>
<style scoped lang="scss">
.long-text-wrapper {
  overflow-wrap: break-word !important;
}
</style>
