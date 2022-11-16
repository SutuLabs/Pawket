<template>
  <div>
    <b-field label="Coin Id">
      <template #message>
        <ul v-if="coinSearchList && coinSearchList.length > 0" class="coin-list">
          <li v-for="coin in coinSearchList" :key="coin.coinId" :class="coin.type">
            <a href="javascript:void(0)" @click="searchCoinId(coin.coinId)"> Search {{ coin.coinId }} </a>
            <b-tooltip label="Open in explorer">
              <a target="_blank" :href="externalExplorerPrefix + coin.coinId">
                <b-icon icon="web" size="is-small"></b-icon>
              </a>
            </b-tooltip>
          </li>
        </ul>
      </template>
      <b-input v-model="coinId" expanded type="text" @keyup.native.enter="searchCoinId(coinId)"></b-input>
      <p class="control">
        <b-button @click="searchCoinId(coinId)">
          <b-icon icon="database-search"></b-icon>
        </b-button>
      </p>
    </b-field>
    <template v-if="coinSpend">
      <b-field v-if="false" label="Result">
        <b-input type="textarea" disabled :value="JSON.stringify(coinSpend, null, 4)"></b-input>
      </b-field>
      <bundle-panel :inputBundleText="bundleText" @coinname="find"></bundle-panel>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import debug from "../../services/api/debug";
import { CoinSpend } from "@/services/spendbundle";
import BundlePanel from "@/components/DevHelper/BundlePanel.vue";
import puzzle from "@/services/crypto/puzzle";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { ConditionOpcode } from "@/services/coin/opcode";
import { prefix0x } from "@/services/coin/condition";
import { NotificationProgrammatic as Notification } from "buefy";
import { getCoinName } from "@/services/coin/coinUtility";
import { rpcUrl } from "@/store/modules/network";
import store from "@/store";

interface CoinSearchType {
  coinId: string;
  type: "PARENT" | "SELF" | "CHILD";
}

@Component({
  components: {
    KeyBox,
    BundlePanel,
  },
})
export default class CoinPanel extends Vue {
  @Prop() public puzzleHash!: string;
  public coinId = "";
  public coinSpend: CoinSpend | null = null;
  public coinSearchList: CoinSearchType[] = [];

  @Watch("puzzleHash")
  onPropertyChanged(value: string, oldValue: string): void {
    if (oldValue == value) return;
    this.searchCoinId(value);
  }

  get bundleText(): string {
    return this.coinSpend == null ? "" : JSON.stringify({ aggregated_signature: "", coin_spends: [this.coinSpend] });
  }

  get externalExplorerPrefix(): string {
    return store.state.network.network.explorerUrl;
  }

  tryDecode(str: string): string {
    if (str.startsWith("0x")) return str;
    try {
      const decoded = puzzle.getPuzzleHashFromAddress(str);
      return decoded;
    } catch {
      return str;
    }
  }

  async searchCoinId(coinId: string): Promise<void> {
    if (coinId) this.coinId = coinId.trim();
    coinId = prefix0x(this.tryDecode(this.coinId));

    this.coinSpend = null;
    this.coinSearchList = [];
    this.coinSpend = await debug.getCoinSolution(coinId, rpcUrl());
    if (!this.coinSpend) {
      Notification.open({
        message: `Search failed`,
        type: "is-danger",
      });
      return;
    }

    this.coinSearchList = [
      { coinId: this.coinSpend.coin.parent_coin_info, type: "PARENT" },
      { coinId: coinId, type: "SELF" },
    ];
    if (this.coinSpend.puzzle_reveal && this.coinSpend.solution) {
      const result = await puzzle.calcPuzzleResult(
        await puzzle.disassemblePuzzle(this.coinSpend.puzzle_reveal),
        await puzzle.disassemblePuzzle(this.coinSpend.solution)
      );
      const conds = assemble(result);
      const argarr = Array.from(conds.as_iter()).map((_) => Array.from(_.as_iter()).map((_) => disassemble(_)));
      const children: CoinSearchType[] = argarr
        .map((_) => ({ op: Number(_[0]), args: _.slice(1) }))
        .filter((_) => _.op == ConditionOpcode.CREATE_COIN)
        .map((_) => ({ address: _.args[0], amount: BigInt(_.args[1]) }))
        .map((_) => getCoinName({ amount: _.amount, parent_coin_info: coinId, puzzle_hash: _.address }))
        .map((_) => ({ coinId: prefix0x(_), type: "CHILD" }));

      this.coinSearchList.push(...children);
    }
  }

  find(coinname: string): void {
    this.searchCoinId(coinname);
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

ul.coin-list {
  list-style: disc;
  padding-left: 2em;
}
li.SELF {
  border-top: 1px solid $info;
  border-bottom: 1px solid $info;
  a {
    color: $grey;
  }
}
</style>
