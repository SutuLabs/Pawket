<template>
  <div>
    <template v-if="errorText">
      <b-notification type="is-danger" has-icon icon="exclamation-thick" :closable="false">
        {{ errorText }}
      </b-notification>
    </template>
    <template v-else>
      <b-field>
        <template #label>
          <span class="is-size-6">{{ $t("bundleSummary.ui.label.sending") }}</span>
          <span class="is-pulled-right">
            <span v-if="unit == 'XCH'">
              {{ amount | demojo }}
            </span>
            <span v-else>
              {{ amount | demojo({ unit: unit, decimal: 3 }) }}
            </span>
          </span>
        </template>
      </b-field>
      <b-field>
        <template #label>
          <span class="is-size-6">{{ $t("bundleSummary.ui.label.to") }}</span>
          <span class="is-size-6 is-pulled-right">
            <b-tooltip :label="address" multilined class="break-string" position="is-left">
              {{ address | shorten }}
            </b-tooltip>
          </span>
        </template>
      </b-field>
      <b-field>
        <template #label>
          <span class="is-size-6 has-text-grey">{{ $t("bundleSummary.ui.label.fee") }}</span>
          <span class="is-size-6 is-pulled-right has-text-grey">
            {{ fee | demojo }}
          </span>
        </template>
      </b-field>
      <b-field class="py-4">
        <template #label>
          <span class="is-size-5">{{ $t("bundleSummary.ui.label.total") }}</span>
          <span class="is-pulled-right is-size-5 has-text-primary">
            <span v-if="unit == 'XCH'">
              {{ (amount + fee) | demojo }}
            </span>
            <span v-else>
              {{ amount | demojo({ unit: unit, decimal: 3 }) }}
              <span v-if="fee > 0"> + {{ fee | demojo }} </span>
            </span>
          </span>
        </template>
      </b-field>

      <b-field>
        <template #label>
          <a href="javascript:void(0)" @click="showDetail = !showDetail" class="has-text-dark">
            <span>{{ $t("bundleSummary.ui.detail.title") }}</span>
            <b-icon :icon="showDetail ? 'menu-up' : 'menu-down'"></b-icon>
          </a>
        </template>
        <template #message>
          <div v-if="showDetail">
            <b-field>
              <template #label>{{ $t("bundleSummary.ui.fee.title") }}</template>
              <template #message>{{ $t("bundleSummary.ui.fee.mojos", { fee }) }}</template>
            </b-field>
            <b-field>
              <template #label>{{ $t("bundleSummary.ui.inputs.title") }}</template>
              <template #message>
                <ul>
                  <li v-for="(amount, unit) in coinTotals" :key="unit">
                    <span v-if="unit == 'XCH'">
                      {{ amount | demojo }}
                    </span>
                    <span v-else>
                      {{ amount | demojo({ unit: unit, decimal: 3 }) }}
                    </span>
                    <span class="has-text-grey">
                      <small>({{ amount }} mojos)</small>
                    </span>
                  </li>
                </ul>
              </template>
            </b-field>
            <b-field>
              <template #label> {{ $t("bundleSummary.ui.label.details") }} </template>
              <ul>
                <li v-for="(coin, id) in newCoins" :key="id">
                  <span v-if="coin.unit == 'XCH'">
                    {{ coin.amount | demojo }}
                  </span>
                  <span v-else>
                    {{ coin.amount | demojo({ unit: coin.unit, decimal: 3 }) }}
                  </span>
                  <span class="has-text-grey">
                    <small>({{ coin.amount }} mojos)</small>
                  </span>
                  {{ $t("bundleSummary.ui.detail.itemTo", { address: coin.address }) }}
                  <span v-if="coin.hint" :title="$t('bundleSummary.ui.detail.span.hint')">({{ coin.hint }})</span>
                  <span v-if="coin.memo" :title="$t('bundleSummary.ui.detail.span.memo')">[{{ coin.memo }}]</span>
                </li>
              </ul>
            </b-field>
            <b-field>
              <template #label>
                {{ $t("bundleSummary.ui.bundle.title") }}
                <key-box
                  icon="checkbox-multiple-blank-outline"
                  :value="bundleText"
                  :tooltip="$t('bundleSummary.ui.bundle.copy')"
                ></key-box>
                <b-button tag="a" icon-left="eye" size="is-small" v-if="!showBundleText" @click="showBundleText = true">
                  {{ $t("bundleSummary.ui.bundle.button.show") }}
                </b-button>
                <b-button tag="a" icon-left="eye-off" size="is-small" v-if="showBundleText" @click="showBundleText = false">
                  {{ $t("bundleSummary.ui.bundle.button.hide") }}
                </b-button>
                <a href="javascript:void(0)" v-if="debugMode" @click="debugBundle()">🐞</a>
              </template>
              <b-input v-if="showBundleText" type="textarea" :value="bundleText"></b-input>
            </b-field>
          </div>
        </template>
      </b-field>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { getNumber, unprefix0x } from "@/services/coin/condition";
import { modsdict } from "@/services/coin/mods";
import store from "@/store";
import { debugBundle } from "@/services/view/bundle";
import { ConditionOpcode } from "@/services/coin/opcode";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { SExp, Tuple } from "clvm";
import { AccountEntity } from "@/store/modules/account";
import { getCatNameDict } from "@/services/coin/cat";
import { demojo } from "@/filters/unitConversion";
import { shorten } from "@/filters/addressConversion";

interface CoinType {
  amount: bigint;
  unit?: string;
  address: string;
  hint?: string;
  memo?: string;
  others?: string[];
}

interface TotalCoinType {
  [unit: string]: bigint;
}

@Component({
  components: {
    KeyBox,
  },
  filters: { demojo, shorten },
})
export default class BundleSummary extends Vue {
  @Prop() private bundle!: string | SpendBundle | null;
  @Prop({ default: null }) private account!: AccountEntity | undefined;
  @Prop() private address!: string;
  @Prop() private amount!: bigint;
  @Prop() private unit!: string;

  public showDetail = false;
  public bundleText = "";
  public showBundleText = false;
  public fee = -1n;
  public coinTotals: TotalCoinType = {};
  public newCoins: CoinType[] = [];
  public errorText = "";

  get debugMode(): boolean {
    return store.state.app.debug;
  }

  get bundleObject(): SpendBundle | null {
    if (typeof this.bundle === "string") {
      return null;
    } else {
      return this.bundle;
    }
  }

  get cats(): { [id: string]: string } {
    return getCatNameDict(this.account);
  }

  async mounted(): Promise<void> {
    this.onBundleChange();
  }

  @Watch("bundle")
  async onBundleChange(): Promise<void> {
    if (typeof this.bundle === "string") {
      try {
        this.bundle = JSON.parse(this.bundle) as SpendBundle;
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("failed to parse bundle", err);
        }

        this.bundle = null;
      }
    }

    if (this.bundle) {
      this.bundleText = JSON.stringify(this.bundle);
      await this.calcBundle(this.bundle);
    }
  }

  debugBundle(): void {
    if (!this.bundleObject) return;
    debugBundle(this, this.bundleObject);
  }

  async calcBundle(sb: SpendBundle): Promise<void> {
    const new_coins: CoinType[] = [];
    const old_coins: { amount: bigint; unit: string }[] = [];
    Vue.set(this, "coinTotals", {});

    for (let i = 0; i < sb.coin_spends.length; i++) {
      const cs = sb.coin_spends[i];
      const puz = await puzzle.disassemblePuzzle(cs.puzzle_reveal);
      const sln = await puzzle.disassemblePuzzle(cs.solution);

      const curried = assemble(puz);
      const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
      const mods = disassemble(mod);
      const argarr = Array.from(args.as_iter()).map((_) => disassemble(_ as SExp));
      const modname = modsdict[mods];
      if (modname != "p2_delegated_puzzle_or_hidden_puzzle" && modname != "cat") {
        this.errorText = this.$tc("bundleSummary.notification.error.unknownMod");
        return;
      }

      const catid = modname == "cat" ? argarr[1] : "XCH";
      const unit = this.cats[catid] ?? catid;

      const coins = await this.executePuzzle(puz, sln);
      new_coins.push(...coins.map((_) => Object.assign({}, _, { unit })));
      old_coins.push({ amount: cs.coin.amount, unit: unit });
      const am = (this.coinTotals[unit] ?? 0n) + cs.coin.amount;
      Vue.set(this.coinTotals, unit, am);
    }

    this.newCoins = new_coins;
    this.fee =
      (this.coinTotals["XCH"] ?? 0n) - this.newCoins.filter((_) => _.unit == "XCH").reduce((t, cur) => t + cur.amount, 0n);
  }

  async executePuzzle(puz: string, solution: string): Promise<CoinType[]> {
    const result = await puzzle.executePuzzle(puz, solution);
    const coins: CoinType[] = result.conditions
      .filter((_) => _.op == ConditionOpcode.CREATE_COIN)
      .map((_) => ({
        address: puzzle.getAddressFromPuzzleHash(_.args[0], "xch"),
        amount: getNumber(_.args[1]),
        args: _.args[2] ? Array.from(assemble(_.args[2]).as_iter()).map((_) => disassemble(_ as SExp)) : [],
      }))
      .map((_) => ({
        address: _.address,
        amount: _.amount,
        hint: this.tryGetHintAddress(_.args[0]),
        memo: _.args[1],
        others: _.args.slice(2),
      }));
    return coins;
  }

  tryGetHintAddress(hex: string | undefined): string | undefined {
    if (!hex) return hex;
    if (!hex.startsWith("0x")) return hex;

    return puzzle.getAddressFromPuzzleHash(unprefix0x(hex), "xch");
  }
}
</script>

<style scoped lang="scss">
ul {
  list-style: inside square;
}

ul ul {
  margin-left: 2em;
}

ul.ellipsis-item > li {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.field ::v-deep textarea {
  font-size: 0.8em;
}

.break-string {
  word-break: break-word;
}
</style>
