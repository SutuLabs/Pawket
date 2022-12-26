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
          :value="selectedCoin"
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
                  <span v-if="key == 'Amount'" :title="demojo(BigInt(val))">{{ val }}</span>
                  <span v-else>{{ val }}</span>
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
                v-if="conditionsdict[sol.code]"
                :label="conditionsdict[sol.code].args + '\n' + conditionsdict[sol.code].desc"
                multilined
              >
                <div class="control mr-2">
                  <div class="tags has-addons">
                    <span class="tag is-info">
                      {{ conditionsdict[sol.code].id }}
                    </span>
                    <span class="tag is-info is-light">
                      {{ conditionsdict[sol.code].name }}
                    </span>
                  </div>
                </div>
              </b-tooltip>
              <ul v-if="sol.args.length > 0" class="args_list ellipsis-item">
                <li v-for="(arg, i) in sol.args" :key="i" :title="getArgMsg(arg)">{{ getArgMsg(arg) }}</li>
                <li v-if="sol.code == 60">
                  <b-tag type="is-primary is-light">annoID:</b-tag>
                  {{ sha256(used_coin_name, sol.args[0]) }}
                </li>
                <li v-if="sol.code == 62">
                  <b-tag type="is-primary is-light">annoID:</b-tag>
                  {{ sha256(bundle.coin_spends[selectedCoin].coin.puzzle_hash, sol.args[0]) }}
                </li>
                <li v-if="sol.code == 51">
                  <b-tag type="is-primary is-light">amount:</b-tag>
                  {{ getNumber(sol.args[1]) }}
                </li>
                <li v-if="sol.code == 51">
                  <b-tag type="is-primary is-light"
                    >Name:
                    <b-tooltip label="Find Coin Name">
                      <a href="javascript:void(0)" @click="find(getCoinNameInternal(...sol.args))">
                        <b-icon icon="web" size="is-small"></b-icon>
                      </a>
                    </b-tooltip>
                  </b-tag>
                  {{ getCoinNameInternal(...sol.args) }}
                </li>
              </ul>
            </li>
          </ul>
        </template>
      </b-field>
      <hr />
      <b-field class="overall-check">
        <template #label>
          Overall Check
          <b-button tag="a" size="is-small" @click="check()"> Check </b-button>
        </template>
        <template #message>
          <h3 v-if="mgraphGenerated">Fee: {{ fee }}</h3>
          <AnnouncementList
            :annoAsserted="puzzleAnnoAsserted"
            :annoCreates="puzzleAnnoCreates"
            title="Puzzle Announcement"
          ></AnnouncementList>
          <AnnouncementList
            :annoAsserted="coinAnnoAsserted"
            :annoCreates="coinAnnoCreates"
            title="Coin Announcement"
          ></AnnouncementList>

          <h3 v-if="coinAvailability.length > 0">Coin Availability</h3>
          <ul v-if="coinAvailability.length > 0" class="args_list ellipsis-item">
            <li v-for="(ca, i) in coinAvailability" :key="i">
              <b-button tag="a" size="is-small" @click="changeCoin(ca.coinIndex)">
                {{ ca.coinIndex }}
              </b-button>
              <b-tag v-if="ca.availability == 'Available'" type="is-success is-light">UTXO</b-tag>
              <b-tag v-else-if="ca.availability == 'Ephemeral'" type="is-success is-light">Ephemeral</b-tag>
              <b-tag v-else-if="ca.availability == 'NotFound'" type="is-danger is-light">NotFound</b-tag>
              <b-tag v-else-if="ca.availability == 'Unexecutable'" type="is-danger">Unexecutable</b-tag>
              <b-tag v-else-if="ca.availability == 'Settlement'" type="is-warning">Settlement</b-tag>
              <b-tag v-else-if="ca.availability == 'Used'" type="is-danger is-light">Used</b-tag>
              <b-tag v-else type="is-light">Unknown</b-tag>
              {{ ca.coinName }}
            </li>
          </ul>

          <template v-if="sigVerified !== 'None' && aggSigMessages.length > 0">
            <h3>
              Signatures
              <b-tag v-if="sigVerified == 'Verified'" type="is-success is-light">Verified</b-tag>
              <b-tag v-else type="is-danger is-light">Failed</b-tag>
            </h3>
            <ul class="args_list">
              <li v-for="(ca, i) in aggSigMessages" :key="i">
                <b-button tag="a" size="is-small" @click="changeCoin(ca.coinIndex)">
                  {{ ca.coinIndex }}
                </b-button>
                <b-tag v-if="!ca.coinName" type="is-warning is-light">AGG_SIG_UNSAFE</b-tag>
                <key-box v-if="ca.coinName" :value="ca.coinName" :showValue="true" tooltip="Coin Name"></key-box>
                <key-box :value="ca.message" :showValue="true" tooltip="Message"></key-box>
                <key-box :value="ca.publicKey" :showValue="true" tooltip="Public Key"></key-box>
              </li>
            </ul>
          </template>

          <template v-if="mgraphGenerated">
            <h3>
              Dependency Graph
              <key-box
                v-if="mermaidSvg"
                :value="mermaidSvg"
                icon="checkbox-multiple-blank-outline"
                tooltip="Copy Graph SVG"
              ></key-box>
            </h3>
            <b-field grouped group-multiline>
              <div v-for="leg in depGraphLegends" :key="leg.key" class="control">
                <b-taglist attached>
                  <b-tag :type="leg.class ? leg.class : 'is-info'">{{ leg.key }}</b-tag>
                  <b-tag :type="(leg.class ? leg.class : 'is-info') + ' is-light'">{{ leg.description }}</b-tag>
                </b-taglist>
              </div>
            </b-field>
            <div v-html="mermaidSvg"></div>
          </template>
        </template>
      </b-field>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle, { ConditionArgs, ConditionEntity } from "@/services/crypto/puzzle";
import { beautifyLisp } from "@/services/coin/lisp";
import {
  conditionDict,
  ConditionInfo,
  prefix0x,
  getNumber,
  Hex0x,
  getFirstLevelArgMsg,
  getArgMsg,
} from "@/services/coin/condition";
import { modsdict, modsprog } from "@/services/coin/mods";
import UncurryPuzzle from "@/components/DevHelper/UncurryPuzzle.vue";
import AnnouncementList from "@/components/DevHelper/AnnouncementList.vue";
import { decodeOffer } from "@/services/offer/encoding";
import { chainId, rpcUrl, xchPrefix } from "@/store/modules/network";
import { getCoinName } from "@/services/coin/coinUtility";
import debug from "@/services/api/debug";
import { demojo } from "@/filters/unitConversion";
import { OneTokenInfo } from "@/models/account";
import {
  AggSigMessage,
  AnnouncementCoin,
  checkSpendBundle,
  CoinAvailability,
  CoinIndexInfo,
  CoinSpend,
  OriginCoin,
  SpendBundle,
} from "@/services/spendbundle";
import { sha256 } from "@/services/offer/bundler";

@Component({
  components: {
    KeyBox,
    UncurryPuzzle,
    AnnouncementList,
  },
})
export default class BundlePanel extends Vue {
  @Prop() public inputBundleText!: string;
  public bundleText = "";
  public used_coin_name: Hex0x = "()";
  public used_coin_tgt_address = "";
  public puzzle = "";
  public puzzle_hash = "";
  public solution = "";
  public solution_result = "";
  public selectedCoin = -1;
  public solution_results: ConditionEntity[] = [];
  public bundle: SpendBundle | null = null;
  public autoCalculation = false;
  public solution_executor: "NORMAL" | "SETTLEMENT" | "ERROR" = "NORMAL";

  public puzzleAnnoCreates: AnnouncementCoin[] = [];
  public puzzleAnnoAsserted: AnnouncementCoin[] = [];
  public coinAnnoCreates: AnnouncementCoin[] = [];
  public coinAnnoAsserted: AnnouncementCoin[] = [];
  public coinAvailability: CoinAvailability[] = [];
  public coinMods: { coinIndex: number; mods: string }[] = [];
  public aggSigMessages: AggSigMessage[] = [];
  public createdCoins: { [key: string]: CoinIndexInfo } = {};
  public fee = 0n;
  public sigVerified: "None" | "Verified" | "Failed" = "None";
  public mgraphGenerated = false;
  public mermaidSvg = "";
  public depGraphLegends = [
    {
      key: "SIG",
      description: "Signature",
      class: "is-success",
    },
    {
      key: "SIG_UNSAFE",
      description: "Unsafe Signature",
      class: "is-warning",
    },
    {
      key: "PA",
      description: "Puzzle Anno.",
    },
    {
      key: "CA",
      description: "Coin Anno.",
    },
    {
      key: "CP",
      description: "Coin Puzzle (Creation)",
    },
  ];
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

    this.puzzleAnnoCreates = [];
    this.puzzleAnnoAsserted = [];
    this.coinAnnoCreates = [];
    this.coinAnnoAsserted = [];
    this.coinAvailability = [];
    this.aggSigMessages = [];
    this.createdCoins = {};
    this.coinMods = [];
    this.sigVerified = "None";
    this.fee = 0n;
    this.mgraphGenerated = false;

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

  BigInt(n: string | number | bigint | boolean): bigint {
    return BigInt(n);
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

  demojo(mojo: null | number | bigint, token: OneTokenInfo | null = null, digits = -1): string {
    return demojo(mojo, token, digits);
  }

  saveBundle(): void {
    if (this.inputBundleText == this.bundleText) return;
    localStorage.setItem("BUNDLE_DEBUG", this.bundleText);
  }

  saveSettings(): void {
    localStorage.setItem("BUNDLE_AUTO_CALCULATION", this.autoCalculation.toString());
  }

  find(coinname: string): void {
    this.$emit("coinname", coinname);
  }

  async changeCoin(idx: number): Promise<void> {
    if (idx == this.selectedCoin) return;

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

  public sha256(...args: (Hex0x | string | Uint8Array | undefined | ConditionArgs)[]): string {
    return sha256(...args);
  }

  public getNumber(arg: string | ConditionArgs): bigint {
    return getNumber(typeof arg === "string" ? arg : getFirstLevelArgMsg(arg));
  }

  public getCoinNameInternal(...args: ConditionArgs[]): string {
    if (!this.bundle) return "";
    const coin: OriginCoin = {
      puzzle_hash: prefix0x(getFirstLevelArgMsg(args[0])),
      amount: this.getNumber(args[1]),
      parent_coin_info: this.used_coin_name,
    };
    return getCoinName(coin);
  }

  public getArgMsg(arg: ConditionArgs): string {
    return getArgMsg(arg);
  }

  public async check(): Promise<void> {
    if (!this.bundle) return;
    var result = await checkSpendBundle(this.bundle, chainId());
    if (!result) return;
    Vue.set(this, "puzzleAnnoCreates", result.puzzleAnnoCreates);
    Vue.set(this, "puzzleAnnoAsserted", result.puzzleAnnoAsserted);
    Vue.set(this, "coinAnnoCreates", result.coinAnnoCreates);
    Vue.set(this, "coinAnnoAsserted", result.coinAnnoAsserted);
    Vue.set(this, "coinAvailability", result.coinAvailability);
    Vue.set(this, "aggSigMessages", result.aggSigMessages);
    Vue.set(this, "coinMods", result.coinMods);
    Vue.set(this, "sigVerified", result.sigVerified);
    Vue.set(this, "createdCoins", result.createdCoins);
    Vue.set(this, "fee", result.fee);

    for (let i = 0; i < this.coinAvailability.length; i++) {
      const ca = this.coinAvailability[i];

      if (ca.availability == "Unexecutable" || ca.availability == "Settlement" || ca.availability == "Ephemeral") continue;

      debug
        .getCoinSolution(ca.coinName, rpcUrl())
        .then((resp) => {
          if (!resp.puzzle_reveal && !resp.solution) {
            ca.availability = "Available";
          } else {
            ca.availability = "Used";
          }
        })
        .catch(() => {
          ca.availability = "NotFound";
        });
    }

    this.renderMermaid();
  }

  public async renderMermaid(): Promise<void> {
    this.mgraphGenerated = true;
    await new Promise((resolve) => setTimeout(resolve, 50));

    const mermaid = (await import(/* webpackChunkName: "mermaid" */ "mermaid")).default;
    mermaid.mermaidAPI.initialize({ startOnLoad: false });
    const insertSvg = (svgCode: string) => {
      this.mermaidSvg = svgCode;
    };
    let graphDefinition = "graph LR;";
    // graphDefinition += "SIG(SIG);";
    for (let i = 0; i < this.aggSigMessages.length; i++) {
      const sig = this.aggSigMessages[i];
      graphDefinition += `${sig.coinIndex}:::${sig.coinName ? "Sig" : "SigUnsafe"};`;
      // graphDefinition += `SIG -- SIG --> ${sig.coinIndex};`;
    }

    for (let i = 0; i < this.coinMods.length; i++) {
      const coin = this.coinMods[i];

      if (!coin.mods) continue;
      const mods =
        coin.mods == "singleton_launcher()"
          ? "Launcher"
          : coin.mods == "p2_delegated_puzzle_or_hidden_puzzle()"
          ? "XCH"
          : coin.mods == "settlement_payments()"
          ? "XCH-O"
          : coin.mods == "cat_v2()"
          ? "CAT"
          : coin.mods == "cat_v2(p2_delegated_puzzle_or_hidden_puzzle())"
          ? "CAT"
          : coin.mods == "cat_v2(settlement_payments())"
          ? "CAT-O"
          : coin.mods == "singleton_top_layer_v1_1(did_innerpuz(p2_delegated_puzzle_or_hidden_puzzle()))"
          ? "DID"
          : coin.mods ==
            "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),p2_delegated_puzzle_or_hidden_puzzle())))"
          ? "NFT"
          : coin.mods ==
            "singleton_top_layer_v1_1(nft_state_layer(nft_ownership_layer(nft_ownership_transfer_program_one_way_claim_with_royalties(),settlement_payments())))"
          ? "NFT-O"
          : "";
      if (coin.mods && !mods) console.warn("mods", coin.mods);
      if (!mods) continue;

      graphDefinition += `${coin.coinIndex}[${coin.coinIndex}:${mods}];`;
    }

    for (let i = 0; i < this.puzzleAnnoAsserted.length; i++) {
      const ass = this.puzzleAnnoAsserted[i];
      const cre = this.puzzleAnnoCreates.find((_) => _.message == ass.message);
      if (cre) {
        graphDefinition += `${ass.coinIndex} -- PA --> ${cre.coinIndex};`;
      } else {
        graphDefinition += `${ass.coinIndex} -- PA --> ?;`;
      }
    }

    for (let i = 0; i < this.coinAnnoAsserted.length; i++) {
      const ass = this.coinAnnoAsserted[i];
      const cre = this.coinAnnoCreates.find((_) => _.message == ass.message);
      if (cre) {
        graphDefinition += `${ass.coinIndex} -- CA --> ${cre.coinIndex};`;
      } else {
        graphDefinition += `${ass.coinIndex} -- CA --> ?;`;
      }
    }

    for (let i = 0; i < this.coinAvailability.length; i++) {
      const av = this.coinAvailability[i];
      if (av.availability == "Ephemeral") {
        graphDefinition += `${av.coinIndex} -- CP --> ${av.dependenceIndex};`;
      }
    }

    const ccoins = Object.values(this.createdCoins)
      .filter((_) => !_.nextIndex)
      .map((_) => ({ name: _.coinName.slice(2, 8), amount: _.amount, coinIndex: _.coinIndex }));

    if (ccoins.length > 0) {
      graphDefinition += `subgraph UTXO;${ccoins.map((_) => _.name).join(";")};end;`;
      graphDefinition += ccoins.map((coin) => `${coin.name} --> ${coin.coinIndex};`).join("");
    }

    graphDefinition += `classDef Sig fill:#EFFAF5,stroke:#48C78E;`;
    graphDefinition += `classDef SigUnsafe fill:#FFFAEB,stroke:#FFE08A;`;
    graphDefinition += `classDef NoSig fill:#FEECF0,stroke:#F14668;`;
    graphDefinition = graphDefinition.replaceAll(";", ";\n");
    try {
      mermaid.mermaidAPI.render("mgraph", graphDefinition, insertSvg);
    } catch (error) {
      console.warn("mermaid failure definition:", graphDefinition);
      throw error;
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";

.overall-check ::v-deep h3 {
  margin: 1.5em 0 1em 0;
  font-weight: bold;
}
</style>
