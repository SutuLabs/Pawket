<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <span v-if="activity.spent" class="modal-card-title has-text-dark is-size-5 has-text-weight-bold">{{
        $t("utxoDetail.ui.title.cost")
      }}</span>
      <span v-else class="modal-card-title has-text-dark is-size-5 has-text-weight-bold">{{
        $t("utxoDetail.ui.title.receive")
      }}</span>
      <span v-if="tokenInfo[activity.symbol]" class="has-text-dark is-size-5 has-text-weight-bold has-text-right">
        {{ activity.spent ? "-" : "+" }}{{ activity.coin.amount | demojo(tokenInfo[activity.symbol]) }}
        <p class="has-text-grey is-size-7">{{ activity.coin.amount }} mojos</p>
      </span>
    </header>
    <section class="modal-card-body">
      <b-field :label="$t('utxoDetail.ui.label.time')" custom-class="is-medium">
        <p class="has-text-grey">{{ new Date(activity.timestamp * 1000).toISOString() }}</p>
      </b-field>
      <b-field custom-class="is-medium">
        <template #label>
          {{ $t("utxoDetail.ui.label.height") }}
          <b-tooltip :label="$t('utxoDetail.ui.tooltip.blockchainExplorer')">
            <a target="_blank" :href="externalExplorerPrefix + activity.confirmedBlockIndex">
              <b-icon icon="open-in-new" size="is-small"> </b-icon>
            </a>
          </b-tooltip>
        </template>
        <p class="has-text-grey">{{ activity.confirmedBlockIndex }}</p>
      </b-field>
      <b-field :label="$t('utxoDetail.ui.label.parentCoinInfo')" custom-class="is-medium">
        <p class="long-text-wrapper has-text-grey">
          {{ activity.coin.parentCoinInfo }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('utxoDetail.ui.tooltip.copy')"
            :value="activity.coin.parentCoinInfo"
          ></key-box>
        </p>
      </b-field>
      <b-field :label="$t('utxoDetail.ui.label.puzzleHash')" custom-class="is-medium">
        <p class="long-text-wrapper has-text-grey">
          {{ activity.coin.puzzleHash }}
          <key-box
            icon="checkbox-multiple-blank-outline"
            :tooltip="$t('utxoDetail.ui.tooltip.copy')"
            :value="activity.coin.puzzleHash"
          ></key-box>
        </p>
      </b-field>
    </section>
  </div>
</template>

<script lang="ts">
import { demojo } from "@/filters/unitConversion";
import { CoinRecord } from "@/models/wallet";
import store from "@/store";
import { TokenInfo } from "@/store/modules/account";
import { Component, Emit, Prop, Vue } from "vue-property-decorator";
import KeyBox from "./KeyBox.vue";

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo },
})
export default class UtxoDetail extends Vue {
  @Prop() private activity!: CoinRecord;
  @Prop() private tokenInfo!: TokenInfo;
  public showDetail = false;

  get externalExplorerPrefix(): string {
    return store.state.app.externalExplorerPrefix;
  }

  @Emit("close")
  close(): void {
    return;
  }
}
</script>
<style scoped lang="scss">
.long-text-wrapper {
  max-width: 20rem;
  overflow-wrap: break-word !important;
}
</style>
