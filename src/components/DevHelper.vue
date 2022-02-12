<template>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Debug</p>
      <button type="button" class="delete" @click="close()"></button>
    </header>
    <section class="modal-card-body">
      <b-tabs position="is-centered" class="block">
        <b-tab-item label="Bech32m">
          <b-field label="Address" :message="address_hash">
            <b-input v-model="origin_address" type="text" @input="changeAddress()"></b-input>
          </b-field>
          <b-field label="Hash" :message="hash_address">
            <b-input v-model="origin_hash" type="text" @input="changeHash()"></b-input>
          </b-field>
        </b-tab-item>
        <b-tab-item label="CLVM">
          <b-field label="ChiaLisp/CLVM/Hex">
            <b-input type="textarea" v-model="origin_cl" @input="updateCl()"></b-input>
          </b-field>
          <b-field label="Translated" :message="cl_type">
            <b-input type="textarea" v-model="translated_cl" disabled></b-input>
            {{ cl_extra }}
          </b-field>
        </b-tab-item>
        <b-tab-item label="Bundle">
          <b-field>
            <template #label>
              Bundle
              <key-box display="✂️" :value="bundleText" tooltip="Copy"></key-box>
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
            <b-field label="used coin name">
              <template #message>
                Amount: {{ bundle.coin_spends[selectedCoin].coin.amount }}<br />
                ParentCoinInfo: {{ bundle.coin_spends[selectedCoin].coin.parent_coin_info }}
              </template>
              <b-input :value="used_coin_name" type="text" disabled></b-input>
            </b-field>
            <b-field label="used coin address" :message="bundle.coin_spends[selectedCoin].coin.puzzle_hash">
              <b-input :value="used_coin_tgt_address" type="text" disabled></b-input>
            </b-field>
            <b-field>
              <template #label>
                Puzzle
                <key-box display="✂️" :value="puzzle" tooltip="Copy"></key-box>
                <b-button size="is-small" @click="uncurry(puzzle)">Uncurry</b-button>
                <span v-if="modsdict[puzzle]" class="tag is-info is-light is-small">{{ modsdict[puzzle] }}</span>
              </template>
              <b-input type="textarea" disabled :value="puzzle"></b-input>
            </b-field>
            <b-field v-if="uncurried_module">
              <template #label>
                Uncurried Result
                <key-box display="✂️" :value="uncurried_module" tooltip="Copy"></key-box>
              </template>
              <template #message>
                <ul class="args_list">
                  <li v-for="(arg, i) in uncurried_args" :key="i">
                    {{ arg }}
                    <span v-if="modsdict[arg]" class="tag is-info is-light is-small">{{ modsdict[arg] }}</span>
                  </li>
                </ul>
              </template>
              <b-input type="textarea" disabled :value="uncurried_module"></b-input>
            </b-field>
            <b-field>
              <template #label>
                Solution
                <key-box display="✂️" :value="solution" tooltip="Copy"></key-box>
                <b-button size="is-small" @click="executePuzzle(puzzle, solution)">Execute</b-button>
                <b-button size="is-small" @click="solution = beautifyLisp(solution)">
                  <b-icon icon="format-paint"></b-icon>
                </b-button>
              </template>
              <b-input type="textarea" disabled :value="solution"></b-input>
            </b-field>
            <b-field v-if="solution_result">
              <template #label>
                Solution Result
                <key-box display="✂️" :value="solution_result" tooltip="Copy"></key-box>
                <b-button size="is-small" @click="solution_result = beautifyLisp(solution_result)">
                  <b-icon icon="format-paint"></b-icon>
                </b-button>
              </template>
              <b-input type="textarea" disabled :value="solution_result"></b-input>
            </b-field>
          </template>
        </b-tab-item>
      </b-tabs>
    </section>
    <footer class="modal-card-foot">
      <b-button label="Close" @click="close()"></b-button>
    </footer>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Emit } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { SpendBundle } from '@/models/wallet';
import puzzle from '@/services/crypto/puzzle';
import transfer from '@/services/transfer/transfer';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import { uncurry } from 'clvm_tools/clvm_tools/curry';
import { SExp, Tuple } from "clvm";

@Component({
  components: {
    KeyBox,
  },
})
export default class DevHelper extends Vue {
  @Prop() private inputBundleText!: string;
  public bundleText = "";
  public used_coin_name = "";
  public used_coin_tgt_address = "";
  public puzzle = "";
  public solution = "";
  public solution_result = "";
  public selectedCoin = 0;
  public uncurried_module = "";
  public uncurried_args: string[] = [];
  public bundle: SpendBundle | null = null;

  public address_hash = "";
  public origin_address = "";
  public hash_address = "";
  public origin_hash = "";

  public origin_cl = "";
  public cl_type: "hex" | "clsp" | "clvm" | "" = "";
  public translated_cl = "";
  public cl_extra = "";

  public readonly modsdict: { [mod: string]: string } = {
    "(a (q 2 10 (c 2 (c 3 ()))) (c (q (51 . 62) (a (i 5 (q 4 (c 12 (c (a 30 (c 2 (c 9 ()))) ())) (a 22 (c 2 (c 25 (c (a 10 (c 2 (c 13 ()))) ()))))) ()) 1) (a (i 5 (q 4 (c 8 9) (a 22 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))"
      : "settlement_payments",
  }

  async updateCl(): Promise<void> {
    if (this.origin_cl.startsWith("0x") || this.origin_cl.startsWith("ff")) {
      this.cl_type = "hex";
      this.translated_cl = await puzzle.disassemblePuzzle(this.origin_cl);
      this.cl_extra = "";
    }
    else if (this.origin_cl.trim().indexOf("\n") == -1) {
      this.cl_type = "clvm";
      this.translated_cl = await puzzle.encodePuzzle(this.origin_cl);
      this.cl_extra = await puzzle.getPuzzleHashFromPuzzle(this.origin_cl);
    }
    else {
      this.cl_type = "clsp";
      this.translated_cl = await puzzle.compileRun(this.origin_cl);
      this.cl_extra = "";
    }
  }

  changeAddress(): void {
    this.address_hash = puzzle.getPuzzleHashFromAddress(this.origin_address);
  }
  changeHash(): void {
    this.hash_address = puzzle.getAddressFromPuzzleHash(this.origin_hash, "xch");
  }

  updateBundle(): void {
    try {
      this.bundle = JSON.parse(this.bundleText.replace(/'/g, '"'));
    } catch (error) {
      this.bundle = null;
    }

    this.changeCoin(0);
    this.save();
  }

  get bundleJson(): string {
    return JSON.stringify(this.bundle, null, 4);
  }

  mounted(): void {
    // console.log(this.beautifyLisp('((70 0xcfc57e87082a076c05acfe5c6f2e89c34e0bf0572e9bf278f0d4cfffcf149338) (60 0x5ebf47089c24e748881dc0eea96e8a94ea48e236526bde3fb293d99238fecab4) (61 0x92e3e2979754cecffd5d3aa3db521e4dab109c15523eb5940a69119ced36ec02) (50 0xb00d78ca128b87506a8e6b02cdadd1c4e5da26d2248f3df290c2fabf617a49becd40c8e8fb22db6df020e4f89fae756c 0xfcee98e201e03cf19329f4d65833cdf36c513e22c0df429d3a6c2954f6b60ec7) (51 0xdf4ec566122b8507fc920d03b04d7021909d5bcd58beed99710ba9bea58f970b 1000 (0xbae24162efbd568f89bc7a340798a6118df0189eb9e3f8697bcea27af99f8f79)) (51 0x9d9e5a5d1a5860f5c30b43123e9293d70123ba4264bea2e6304e5ccde7f41ba5 0x01068b) (63 0xc2e7416bf62c2d1a4c8c71ca34bf70603332ac19fe541ae64af6370b2a218ded))'));
    if (this.inputBundleText) {
      this.bundleText = this.inputBundleText;
      this.updateBundle();
    }
    else {
      this.load();
    }
  }

  load(): void {
    const bd = localStorage.getItem("BUNDLE_DEBUG");
    if (bd) {
      this.bundleText = bd;
      this.updateBundle();
    }
  }

  save(): void {
    localStorage.setItem("BUNDLE_DEBUG", this.bundleText);
  }

  async changeCoin(idx: number): Promise<void> {
    this.selectedCoin = idx;
    this.solution_result = "";
    this.uncurried_args = [];
    this.uncurried_module = "";
    await this.update();
  }

  async executePuzzle(puz: string, solution: string): Promise<void> {
    this.solution_result = await puzzle.calcPuzzleResult(puz, solution);
  }

  async uncurry(puz: string): Promise<void> {
    const curried = assemble(puz);
    const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
    const mods = disassemble(mod);
    const argarr = Array.from(args.as_iter()).map(_ => disassemble(_ as any));
    this.uncurried_module = mods;
    this.uncurried_args = argarr;
  }

  async update(): Promise<void> {
    if (!this.bundle) return;
    this.puzzle = await puzzle.disassemblePuzzle(this.bundle.coin_spends[this.selectedCoin].puzzle_reveal);
    this.solution = await puzzle.disassemblePuzzle(this.bundle.coin_spends[this.selectedCoin].solution);
    this.used_coin_name = transfer.getCoinName(this.bundle.coin_spends[this.selectedCoin].coin).hex();
    this.used_coin_tgt_address = puzzle.getAddressFromPuzzleHash(this.bundle.coin_spends[this.selectedCoin].coin.puzzle_hash, "xch");
  }

  // not finished, cannot use
  beautifyLisp(lisp: string): string {
    let output = "";
    let indent = 0;
    const indentSpace = (indent: number) => {
      if (indent == 0) return "";
      return Array(indent * 2).fill(" ").join("");
    };
    for (let i = 0; i < lisp.length - 1; i++) {
      const c = lisp[i];
      const nc = lisp[i + 1];
      output += c;

      switch (c) {
        case "(":
          indent += 1;
          break;

        case ")":
          indent -= 1;
          break;

        default:
          break;
      }

      switch (true) {
        case c == "(" && nc == "(":
          output += "\n";
          output += indentSpace(indent);
          break;
        case c == " " && nc == "(":
          output += "\n";
          output += indentSpace(indent);
          break;

        default:
          break;
      }
    }

    output += lisp[lisp.length - 1];

    return output;
  }

  @Emit("close")
  close(): void {
    return;
  }

}
</script>

<style scoped lang="scss">
ul.args_list {
  list-style: inside square;
}

.field ::v-deep textarea {
  font-size: 0.8em;
}
</style>
