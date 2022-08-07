<template>
  <div>
    <b-field>
      <template #label>
        Bundle
        <key-box icon="checkbox-multiple-blank-outline" :value="bundleText" tooltip="Copy"></key-box>
      </template>
      <b-input type="textarea" v-model="bundleText" @input="updateBundle()"></b-input>
    </b-field>
    <template v-if="bundle">
      <b-field v-if="bundle.coin_spends.length > 1">
        <b-radio-button
          v-for="(coin, idx) in bundle.coin_spends"
          :key="idx"
          v-model="selectedCoin"
          :native-value="idx"
          type="is-info"
          @input="changeCoin(idx)"
        >
          <span>{{ idx }}</span>
        </b-radio-button>
      </b-field>
      <b-field>
        <template #label>
          Information
          <b-switch v-model="autoCalculation" size="is-small" class="is-pulled-right" @input="saveSettings()"
            >Auto Calculation</b-switch
          >
        </template>
        <template #message>
          <ul>
            <li
              class="pt-1"
              v-for="(val, key) in {
                Amount: bundle.coin_spends[selectedCoin].coin.amount,
                'Parent Coin': bundle.coin_spends[selectedCoin].coin.parent_coin_info,
                'Coin Name': used_coin_name,
                'Coin Address': used_coin_tgt_address,
                'Coin PuzHash': bundle.coin_spends[selectedCoin].coin.puzzle_hash,
              }"
              :key="key"
            >
              <b-taglist attached>
                <b-tag type="is-info">{{ key }}</b-tag>
                <b-tag type="">
                  {{ val }}
                  <key-box icon="checkbox-multiple-blank-outline" :value="val" tooltip="Copy"></key-box>
                </b-tag>
              </b-taglist>
            </li>
          </ul>
        </template>
      </b-field>
      <b-field v-if="puzzle">
        <template #label>
          Puzzle
          <span
            v-if="bundle.coin_spends[selectedCoin].coin.puzzle_hash != puzzle_hash"
            class="tag is-danger is-light is-small"
            :title="bundle.coin_spends[selectedCoin].coin.puzzle_hash + ' != ' + puzzle_hash + '[Puzzle]'"
            >! {{ puzzle_hash }}</span
          >
        </template>
        <template #message>
          <uncurry-puzzle :puzzle="puzzle" :defaultShowUncurry="autoCalculation"></uncurry-puzzle>
        </template>
      </b-field>
      <b-field v-if="solution">
        <template #label>
          Solution
          <key-box icon="checkbox-multiple-blank-outline" :value="solution" tooltip="Copy"></key-box>
          <b-button tag="a" size="is-small" @click="executePuzzle(puzzle, solution)">
            Execute
            <span v-if="solution_executor == 'SETTLEMENT'">(Settlement)</span>
          </b-button>
          <b-button tag="a" size="is-small" @click="solution = beautifyLisp(solution)">
            <b-icon icon="format-paint"></b-icon>
          </b-button>
        </template>
        <template #message>
          <div class="puzzle-content">
            {{ solution }}
          </div>
        </template>
      </b-field>
      <b-field v-if="solution_result">
        <template #label>
          Solution Result
          <key-box icon="checkbox-multiple-blank-outline" :value="solution_result" tooltip="Copy"></key-box>
          <b-button tag="a" size="is-small" @click="solution_result = beautifyLisp(solution_result)">
            <b-icon icon="format-paint"></b-icon>
          </b-button>
        </template>
        <template #message>
          <div class="puzzle-content">
            {{ solution_result }}
          </div>
          <ul class="args_list">
            <li v-for="(sol, i) in solution_results" :key="i">
              <b-tooltip
                v-if="conditionsdict[sol.op]"
                :label="conditionsdict[sol.op].args + '\n' + conditionsdict[sol.op].desc"
                multilined
              >
                <div class="control mr-2">
                  <div class="tags has-addons">
                    <span class="tag is-info">
                      {{ conditionsdict[sol.op].id }}
                    </span>
                    <span class="tag is-info is-light">
                      {{ conditionsdict[sol.op].name }}
                    </span>
                  </div>
                </div>
              </b-tooltip>
              <ul v-if="sol.args.length > 0" class="args_list ellipsis-item">
                <li v-for="(arg, i) in sol.args" :key="i" :title="arg">{{ arg }}</li>
                <li v-if="sol.op == 60">
                  <b-tag type="is-primary is-light">annoID:</b-tag>
                  {{ sha256(used_coin_name, sol.args[0]) }}
                </li>
                <li v-if="sol.op == 62">
                  <b-tag type="is-primary is-light">annoID:</b-tag>
                  {{ sha256(bundle.coin_spends[selectedCoin].coin.puzzle_hash, sol.args[0]) }}
                </li>
                <li v-if="sol.op == 51">
                  <b-tag type="is-primary is-light">amount:</b-tag>
                  {{ getNumber(sol.args[1]) }}
                </li>
                <li v-if="sol.op == 51">
                  <b-tag type="is-primary is-light">coin name:</b-tag>
                  {{ getCoinNameInternal(...sol.args) }}
                </li>
              </ul>
            </li>
          </ul>
        </template>
      </b-field>
      <hr />
      <b-field>
        <template #label>
          Overall Check
          <b-button tag="a" size="is-small" @click="check()"> Check </b-button>
        </template>
        <template #message>
          <ul v-if="puzzleAnnoCreates.length > 0" class="args_list ellipsis-item">
            <li v-for="(anno, i) in puzzleAnnoCreates" :key="i" :title="anno.message">
              <span class="mid-message">
                {{ anno.message }}
              </span>
              <b-button tag="a" size="is-small" @click="changeCoin(anno.coinIndex)">
                {{ anno.coinIndex }}
              </b-button>

              <span v-for="(asserted, idx) in [puzzleAnnoAsserted.filter((_) => _.message == anno.message)[0]]" :key="idx">
                <b-tag v-if="asserted" type="is-success is-light">AS</b-tag>
                <b-button v-if="asserted" tag="a" size="is-small" @click="changeCoin(asserted.coinIndex)">
                  {{ asserted.coinIndex }}
                </b-button>
              </span>
              <b-tag v-if="puzzleAnnoAsserted.findIndex((_) => _.message == anno.message) == -1" type="is-warning is-light"
                >No Assert</b-tag
              >
            </li>
          </ul>
        </template>
      </b-field>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { CoinSpend, OriginCoin, SpendBundle } from "@/models/wallet";
import puzzle from "@/services/crypto/puzzle";
import { beautifyLisp } from "@/services/coin/lisp";
import { Bytes } from "clvm";
import { conditionDict, ConditionInfo, prefix0x, getNumber, unprefix0x } from "@/services/coin/condition";
import { modsdict, modsprog } from "@/services/coin/mods";
import UncurryPuzzle from "@/components/DevHelper/UncurryPuzzle.vue";
import { decodeOffer } from "@/services/offer/encoding";
import { xchPrefix } from "@/store/modules/network";
import { getCoinName, getCoinName0x } from "@/services/coin/coinUtility";
import { ConditionOpcode } from "@/services/coin/opcode";

interface AnnouncementCoin {
  coinIndex: number;
  message: string;
}

@Component({
  components: {
    KeyBox,
    UncurryPuzzle,
  },
})
export default class BundlePanel extends Vue {
  @Prop() private inputBundleText!: string;
  public bundleText = "";
  public used_coin_name = "";
  public used_coin_tgt_address = "";
  public puzzle = "";
  public puzzle_hash = "";
  public solution = "";
  public solution_result = "";
  public selectedCoin = 0;
  public solution_results: { op: number; args: string[] }[] = [];
  public bundle: SpendBundle | null = null;
  public autoCalculation = false;
  public solution_executor: "NORMAL" | "SETTLEMENT" | "ERROR" = "NORMAL";

  public puzzleAnnoCreates: AnnouncementCoin[] = [];
  public puzzleAnnoAsserted: AnnouncementCoin[] = [];
  public coinAnnoCreates: AnnouncementCoin[] = [];
  public coinAnnoAsserted: AnnouncementCoin[] = [];

  public readonly modsdict = modsdict;
  public readonly modsprog = modsprog;

  public readonly conditionsdict: { [id: number]: ConditionInfo } = conditionDict;

  async updateBundle(): Promise<void> {
    try {
      if (this.bundleText.startsWith("bundle1")) {
        this.bundle = await decodeOffer(this.bundleText);
        this.bundleText = JSON.stringify(this.bundle);
      } else {
        this.bundle = JSON.parse(this.bundleText.replace(/'/g, '"'));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cs = (this.bundle as any)?.coin_solutions as CoinSpend[];
        if (this.bundle && cs && !this.bundle.coin_spends) {
          Vue.set(this.bundle, "coin_spends", cs);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ba = this.bundle as any;
        if (this.bundle && ba?.CoinSpends) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cs: CoinSpend[] = ba?.CoinSpends.map((_: any) => ({
            coin: {
              parent_coin_info: _.Coin.ParentCoinInfo,
              puzzle_hash: _.Coin.PuzzleHash,
              amount: _.Coin.Amount,
            },
            puzzle_reveal: _.PuzzleReveal,
            solution: _.Solution,
          }));
          Vue.set(this.bundle, "coin_spends", cs);
          Vue.set(this.bundle, "aggregated_signature", ba?.AggregatedSignature);
        }
      }
    } catch (error) {
      this.bundle = null;
    }

    await this.changeCoin(0);
    this.saveBundle();
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  async beforeMount(): Promise<void> {
    await this.loadSettings();
  }

  async mounted(): Promise<void> {
    // console.log(this.beautifyLisp('((70 0xcfc57e87082a076c05acfe5c6f2e89c34e0bf0572e9bf278f0d4cfffcf149338) (60 0x5ebf47089c24e748881dc0eea96e8a94ea48e236526bde3fb293d99238fecab4) (61 0x92e3e2979754cecffd5d3aa3db521e4dab109c15523eb5940a69119ced36ec02) (50 0xb00d78ca128b87506a8e6b02cdadd1c4e5da26d2248f3df290c2fabf617a49becd40c8e8fb22db6df020e4f89fae756c 0xfcee98e201e03cf19329f4d65833cdf36c513e22c0df429d3a6c2954f6b60ec7) (51 0xdf4ec566122b8507fc920d03b04d7021909d5bcd58beed99710ba9bea58f970b 1000 (0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79)) (51 0x9d9e5a5d1a5860f5c30b43123e9293d70123ba4264bea2e6304e5ccde7f41ba5 0x01068b) (63 0xc2e7416bf62c2d1a4c8c71ca34bf70603332ac19fe541ae64af6370b2a218ded))'));
    if (this.inputBundleText) {
      this.bundleText = this.inputBundleText;
      await this.updateBundle();
    } else {
      await this.loadBundle();
    }
    if (this.autoCalculation) {
      await this.executePuzzle(this.puzzle, this.solution);
    }
  }

  beautifyLisp(text: string): string {
    return beautifyLisp(text);
  }

  async loadBundle(): Promise<void> {
    const bd = localStorage.getItem("BUNDLE_DEBUG");
    if (bd) {
      this.bundleText = bd;
      await this.updateBundle();
    }
  }

  async loadSettings(): Promise<void> {
    this.autoCalculation = localStorage.getItem("BUNDLE_AUTO_CALCULATION") === "true";
  }

  saveBundle(): void {
    if (this.inputBundleText == this.bundleText) return;
    localStorage.setItem("BUNDLE_DEBUG", this.bundleText);
  }

  saveSettings(): void {
    localStorage.setItem("BUNDLE_AUTO_CALCULATION", this.autoCalculation.toString());
  }

  async changeCoin(idx: number): Promise<void> {
    this.selectedCoin = idx;
    this.solution_result = "";
    this.puzzle_hash = "";
    this.puzzle = "";
    await this.update();
  }

  async executePuzzle(puz: string, solution: string): Promise<void> {
    if (!puz || !solution) return;
    try {
      const result = await puzzle.executePuzzle(puz, solution);
      this.solution_result = result.raw;
      this.solution_results = result.conditions;
      this.solution_executor = "NORMAL";
    } catch (err) {
      try {
        const result = await puzzle.executePuzzle(modsprog["settlement_payments"], solution);
        this.solution_result = result.raw;
        this.solution_results = result.conditions;
        this.solution_executor = "SETTLEMENT";
      } catch (err) {
        console.warn("puzzle cannot be executed, even with settlement executor.");
        this.solution_executor = "ERROR";
      }
    }
  }

  async update(): Promise<void> {
    if (!this.bundle) return;
    const c = this.bundle.coin_spends[this.selectedCoin];
    if (c.puzzle_reveal && c.solution) {
      this.puzzle = await puzzle.disassemblePuzzle(c.puzzle_reveal);
      this.puzzle_hash = prefix0x(await puzzle.getPuzzleHashFromPuzzle(this.puzzle));
      this.solution = await puzzle.disassemblePuzzle(c.solution);
    }
    this.used_coin_name = prefix0x(getCoinName(c.coin));
    this.used_coin_tgt_address = puzzle.getAddressFromPuzzleHash(c.coin.puzzle_hash, xchPrefix());
  }

  public sha256(...args: string[]): string {
    const cont = new Uint8Array(
      args.map((_) => Bytes.from(unprefix0x(_), "hex").raw()).reduce((acc, cur) => [...acc, ...cur], [] as number[])
    );
    const result = Bytes.SHA256(cont);
    return prefix0x(result.hex());
  }

  public getNumber(arg: string): bigint {
    return getNumber(arg);
  }

  public getCoinNameInternal(...args: string[]): string {
    if (!this.bundle) return "";
    const coin: OriginCoin = {
      puzzle_hash: args[0],
      amount: this.getNumber(args[1]),
      parent_coin_info: this.used_coin_name,
    };
    return getCoinName(coin);
  }

  public async check(): Promise<void> {
    if (!this.bundle) return;
    this.puzzleAnnoCreates = [];
    this.puzzleAnnoAsserted = [];
    this.coinAnnoCreates = [];
    this.coinAnnoAsserted = [];
    const messages = [];
    for (let i = 0; i < this.bundle.coin_spends.length; i++) {
      const cs = this.bundle.coin_spends[i];
      const result = await puzzle.executePuzzleHex(cs.puzzle_reveal, cs.solution);

      this.puzzleAnnoCreates.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.CREATE_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: this.sha256(cs.coin.puzzle_hash, _.args[0]) }))
      );
      this.puzzleAnnoAsserted.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.ASSERT_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: _.args[0] }))
      );
      this.coinAnnoCreates.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.CREATE_COIN_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: this.sha256(getCoinName0x(cs.coin), _.args[0]) }))
      );
      this.coinAnnoAsserted.push(
        ...result.conditions
          .filter((_) => _.op == ConditionOpcode.ASSERT_PUZZLE_ANNOUNCEMENT)
          .map((_) => ({ coinIndex: i, message: _.args[0] }))
      );
      messages.push(
        ...result.conditions.filter((_) => _.op == ConditionOpcode.AGG_SIG_ME).map((_) => ({ coinIndex: i, message: _.args[0] }))
      );
    }
    // console.log(messages);
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";

ul.args_list.ellipsis-item > li .mid-message {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  max-width: 80px;
}
</style>
