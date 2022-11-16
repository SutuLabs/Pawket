<template>
  <div>
    <template v-if="errorText">
      <b-notification v-if="!ignoreError" type="is-danger" has-icon icon="exclamation-thick" :closable="false">
        {{ errorText }}
      </b-notification>
      <bundle-text v-model="bundleText" @debugBundle="debugBundle" :bundleObject="bundleObject"></bundle-text>
    </template>
    <template v-else>
      <b-field>
        <template #label>
          <a href="javascript:void(0)" @click="showDetail = !showDetail" class="has-text-dark">
            <span>{{ $t("bundleSummary.ui.detail.title") }}</span>
            <b-icon :icon="showDetail ? 'menu-up' : 'menu-down'"></b-icon>
          </a>
        </template>
        <template #message>
          <div v-if="showDetail" class="send-detail-box p-2">
            <b-field>
              <template #label>{{ $t("bundleSummary.ui.fee.title") }}</template>
              <template #message>{{ $t("bundleSummary.ui.fee.mojos", { fee }) }}</template>
            </b-field>
            <b-field>
              <template #label>{{ $t("bundleSummary.ui.inputs.title") }}</template>
              <template #message>
                <ul>
                  <li v-for="(amount, unit) in coinTotals" :key="unit">
                    <span v-if="unit == xchSymbol">
                      {{ demojo(amount) }}
                    </span>
                    <span v-else>
                      {{ demojo(amount, { unit: unit.toString(), decimal: 3, symbol: "" }) }}
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
                  <span v-if="coin.unit == xchSymbol">
                    {{ demojo(coin.amount) }}
                  </span>
                  <span v-else-if="coin.unit">
                    {{ demojo(coin.amount, { unit: coin.unit, decimal: 3, symbol: "" }) }}
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
            <bundle-text v-model="bundleText" :bundleObject="bundleObject" @debugBundle="debugBundle"></bundle-text>
          </div>
        </template>
      </b-field>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { SpendBundle } from "@/services/spendbundle";
import puzzle from "@/services/crypto/puzzle";
import { disassemble } from "clvm_tools/clvm_tools/binutils";
import { getArgMsg, getFirstLevelArgMsg, getNumber, unprefix0x } from "@/services/coin/condition";
import { modshexdict } from "@/services/coin/mods";
import store from "@/store";
import { debugBundle } from "@/services/view/bundleAction";
import { ConditionOpcode } from "@/services/coin/opcode";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { SExp, Tuple } from "clvm";
import { AccountEntity, OneTokenInfo } from "@/models/account";
import { getCatNameDict } from "@/services/view/cat";
import { demojo } from "@/filters/unitConversion";
import BundleText from "@/components/Bundle/BundelText.vue";
import { xchPrefix, xchSymbol } from "@/store/modules/network";
import { sexpAssemble } from "@/services/coin/analyzer";

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
    BundleText,
  },
})
export default class BundleSummary extends Vue {
  @Prop() public bundle!: string | SpendBundle | null;
  @Prop({ default: null }) public account!: AccountEntity | undefined;
  @Prop({ default: false }) public ignoreError!: boolean;

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

  get xchSymbol(): string {
    return xchSymbol();
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

      const curried = sexpAssemble(cs.puzzle_reveal);
      const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
      const mods = mod.as_bin().hex();
      const argarr = Array.from(args.as_iter()).map((_) => disassemble(_ as SExp));
      const modname = modshexdict[mods];
      if (modname != "p2_delegated_puzzle_or_hidden_puzzle" && modname != "cat_v2") {
        this.errorText = this.$tc("bundleSummary.notification.error.unknownMod");
        return;
      }

      const catid = modname == "cat_v2" ? argarr[1] : xchSymbol();
      const unit = this.cats[catid] ?? catid;

      const coins = await this.executePuzzle(cs.puzzle_reveal, cs.solution);
      new_coins.push(...coins.map((_) => Object.assign({}, _, { unit })));
      old_coins.push({ amount: cs.coin.amount, unit: unit });
      const am = (this.coinTotals[unit] ?? 0n) + cs.coin.amount;
      Vue.set(this.coinTotals, unit, am);
    }

    this.newCoins = new_coins;
    this.fee =
      (this.coinTotals[xchSymbol()] ?? 0n) -
      this.newCoins.filter((_) => _.unit == xchSymbol()).reduce((t, cur) => t + cur.amount, 0n);
  }

  async executePuzzle(puz_hex: string, solution_hex: string): Promise<CoinType[]> {
    const result = await puzzle.executePuzzleHex(puz_hex, solution_hex);
    const coins: CoinType[] = result.conditions
      .filter((_) => _.code == ConditionOpcode.CREATE_COIN)
      .map((_) => {
        const rawArgs = _.args.at(2);
        const args =
          rawArgs && Array.isArray(rawArgs)
            ? rawArgs.map((_) => getArgMsg(_)) //
            : !rawArgs
            ? [] //
            : [getArgMsg(rawArgs)];
        return {
          address: puzzle.getAddressFromPuzzleHash(getFirstLevelArgMsg(_.args.at(0)), xchPrefix()),
          amount: getNumber(getFirstLevelArgMsg(_.args.at(1))),
          args,
        };
      })
      .map((_) => ({
        address: _.address,
        amount: _.amount,
        hint: this.tryGetHintAddress(_.args.at(0)),
        memo: _.args.at(1),
        others: _.args.slice(2),
      }));
    return coins;
  }

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  tryGetHintAddress(hex: string | undefined): string | undefined {
    if (!hex) return hex;
    if (!hex.startsWith("0x")) return hex;

    return puzzle.getAddressFromPuzzleHash(unprefix0x(hex), xchPrefix());
  }
}
</script>

<style scoped lang="scss">
@import "~bulma/sass/utilities/derived-variables";

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

.send-detail-box {
  border: 1px solid $grey-lighter;
  overflow-wrap: break-word;
}
</style>
