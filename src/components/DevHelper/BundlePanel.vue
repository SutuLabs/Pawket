<template>
  <div>
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
      <b-field label="Information">
        <template #message>
          <ul>
            <li
              class="pt-1"
              v-for="(val, key) in {
                Amount: bundle.coin_spends[selectedCoin].coin.amount,
                ParentCoinInfo: bundle.coin_spends[selectedCoin].coin.parent_coin_info,
                'UsedCoin Name': used_coin_name,
                'UsedCoin Address': used_coin_tgt_address,
                'UsedCoin PuzHash': bundle.coin_spends[selectedCoin].coin.puzzle_hash,
              }"
              :key="key"
            >
              <b-taglist attached>
                <b-tag type="is-info">{{ key }}</b-tag>
                <b-tag type="">{{ val }}</b-tag>
              </b-taglist>
            </li>
          </ul>
        </template>
      </b-field>
      <b-field>
        <template #label>
          Puzzle
          <key-box display="✂️" :value="puzzle" tooltip="Copy"></key-box>
          <b-button tag="a" size="is-small" @click="uncurry(puzzle)">Uncurry</b-button>
          <span v-if="modsdict[puzzle]" class="tag is-info is-light is-small">{{ modsdict[puzzle] }}</span>
        </template>
        <template #message>
          <div class="puzzle-content">
            {{ puzzle }}
          </div>
        </template>
      </b-field>
      <b-field v-if="uncurried_module">
        <template #label>
          Uncurried Result
          <key-box display="✂️" :value="uncurried_module" tooltip="Copy"></key-box>
          <span v-if="modsdict[uncurried_module]" class="tag is-info is-light is-small">{{ modsdict[uncurried_module] }}</span>
        </template>
        <template #message>
          <div class="puzzle-content">
            {{ uncurried_module }}
          </div>
          <ul class="args_list">
            <li v-for="(arg, i) in uncurried_args" :key="i">
              {{ arg }}
              <span v-if="modsdict[arg]" class="tag is-info is-light is-small">{{ modsdict[arg] }}</span>
            </li>
          </ul>
        </template>
      </b-field>
      <b-field>
        <template #label>
          Solution
          <key-box display="✂️" :value="solution" tooltip="Copy"></key-box>
          <b-button tag="a" size="is-small" @click="executePuzzle(puzzle, solution)">Execute</b-button>
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
          <key-box display="✂️" :value="solution_result" tooltip="Copy"></key-box>
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
                  <b-tag type="is-success is-light">annoID:</b-tag>
                  {{ sha256(used_coin_name, sol.args[0]) }}
                </li>
                <li v-if="sol.op == 62">
                  <b-tag type="is-success is-light">annoID:</b-tag>
                  {{ sha256(bundle.coin_spends[selectedCoin].coin.puzzle_hash, sol.args[0]) }}
                </li>
              </ul>
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
import { SpendBundle } from '@/models/wallet';
import puzzle from '@/services/crypto/puzzle';
import transfer from '@/services/transfer/transfer';
import { assemble, disassemble } from 'clvm_tools/clvm_tools/binutils';
import { uncurry } from 'clvm_tools/clvm_tools/curry';
import { SExp, Tuple } from "clvm";
import { beautifyLisp } from '@/services/coin/lisp';
import { Bytes } from "clvm";
import { prefix0x } from '../../services/coin/condition';

interface ConditionInfo {
  name: string;
  id: number;
  args: string;
  desc: string;
}

@Component({
  components: {
    KeyBox,
  },
})
export default class BundlePanel extends Vue {
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
  public solution_results: { op: number, args: string[] }[] = [];
  public bundle: SpendBundle | null = null;

  public readonly modsdict: { [mod: string]: string } = {
    "(a (q 2 10 (c 2 (c 3 ()))) (c (q (51 . 62) (a (i 5 (q 4 (c 12 (c (a 30 (c 2 (c 9 ()))) ())) (a 22 (c 2 (c 25 (c (a 10 (c 2 (c 13 ()))) ()))))) ()) 1) (a (i 5 (q 4 (c 8 9) (a 22 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 2 (i (l 5) (q 11 (q . 2) (a 30 (c 2 (c 9 ()))) (a 30 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))"
      : "settlement_payments",
    "(a (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1))"
      : "p2_delegated_puzzle_or_hidden_puzzle",
    "(a (q 2 94 (c 2 (c (c 5 (c (sha256 44 5) (c 11 ()))) (c (a 23 47) (c 95 (c (a 46 (c 2 (c 23 ()))) (c (sha256 639 1407 2943) (c -65 (c 383 (c 767 (c 1535 (c 3071 ())))))))))))) (c (q (((-54 . 61) 70 2 . 51) (60 . 4) 1 1 . -53) ((a 2 (i 5 (q 2 50 (c 2 (c 13 (c (sha256 34 (sha256 44 52) (sha256 34 (sha256 34 (sha256 44 92) 9) (sha256 34 11 (sha256 44 ())))) ())))) (q . 11)) 1) (a (i 11 (q 2 (i (= (a 46 (c 2 (c 19 ()))) 2975) (q 2 38 (c 2 (c (a 19 (c 95 (c 23 (c 47 (c -65 (c 383 (c 27 ()))))))) (c 383 ())))) (q 8)) 1) (q 2 (i 23 (q 2 (i (not -65) (q . 383) (q 8)) 1) (q 8)) 1)) 1) (c (c 5 39) (c (+ 11 87) 119)) 2 (i 5 (q 2 (i (= (a (i (= 17 120) (q . 89) ()) 1) (q . -113)) (q 2 122 (c 2 (c 13 (c 11 (c (c -71 377) ()))))) (q 2 90 (c 2 (c (a (i (= 17 120) (q 4 120 (c (a 54 (c 2 (c 19 (c 41 (c (sha256 44 91) (c 43 ())))))) 57)) (q 2 (i (= 17 36) (q 4 36 (c (sha256 32 41) 57)) (q . 9)) 1)) 1) (c (a (i (= 17 120) (q . 89) ()) 1) (c (a 122 (c 2 (c 13 (c 11 (c 23 ()))))) ())))))) 1) (q 4 () (c () 23))) 1) ((a (i 5 (q 4 9 (a 38 (c 2 (c 13 (c 11 ()))))) (q . 11)) 1) 11 34 (sha256 44 88) (sha256 34 (sha256 34 (sha256 44 92) 5) (sha256 34 (a 50 (c 2 (c 7 (c (sha256 44 44) ())))) (sha256 44 ())))) (a (i (l 5) (q 11 (q . 2) (a 46 (c 2 (c 9 ()))) (a 46 (c 2 (c 13 ())))) (q 11 44 5)) 1) (c (c 40 (c 95 ())) (a 126 (c 2 (c (c (c 47 5) (c 95 383)) (c (a 122 (c 2 (c 11 (c 5 (q ()))))) (c 23 (c -65 (c 383 (c (sha256 1279 (a 54 (c 2 (c 9 (c 2815 (c (sha256 44 45) (c 21 ())))))) 5887) (c 1535 (c 3071 ()))))))))))) 2 42 (c 2 (c 95 (c 59 (c (a (i 23 (q 9 45 (sha256 39 (a 54 (c 2 (c 41 (c 87 (c (sha256 44 -71) (c 89 ())))))) -73)) ()) 1) (c 23 (c 5 (c 767 (c (c (c 36 (c (sha256 124 47 383) ())) (c (c 48 (c (sha256 -65 (sha256 124 21 (+ 383 (- 735 43) 767))) ())) 19)) ()))))))))) 1))"
      : "cat",
  }

  public readonly conditionsdict: { [id: number]: ConditionInfo } = [
    { name: "AGG_SIG_UNSAFE", id: 49, args: "(49 pubkey message)", desc: "This spend is only valid if the attached aggregated signature contains a signature from the given public key of the given message. This is labeled unsafe because if you sign a message once, any other coins you have that require that signature may potentially also be unlocked. It's probably better just to use AGG_SIG_ME because of the natural entropy introduced by the coin ID." },
    { name: "AGG_SIG_ME", id: 50, args: "(50 pubkey message)", desc: "This spend is only valid if the attached aggregated signature contains a signature from the specified public key of that message concatenated with the coin's ID and the network's genesis challenge." },
    { name: "CREATE_COIN", id: 51, args: "(51 puzzlehash amount)", desc: "If this spend is valid, then create a new coin with the given puzzlehash and amount." },
    { name: "RESERVE_FEE", id: 52, args: "(52 amount)", desc: "This spend is only valid if there is unused value in this transaction greater than or equal to amount, which is explicitly to be used as the fee." },
    { name: "CREATE_COIN_ANNOUNCEMENT", id: 60, args: "(60 message)", desc: "If this spend is valid, this creates an ephemeral announcement with an ID dependent on the coin that creates it. Other coins can then assert an announcement exists for inter-coin communication inside a block." },
    { name: "ASSERT_COIN_ANNOUNCEMENT", id: 61, args: "(61 announcementID)", desc: "This spend is only valid if there was an announcement in this block matching the announcementID. The announcementID is the hash of the message that was announced concatenated with the coin ID of the coin that announced it announcementID == sha256(coinID + message)." },
    { name: "CREATE_PUZZLE_ANNOUNCEMENT", id: 62, args: "(62 message)", desc: "If this spend is valid, this creates an ephemeral announcement with an ID dependent on the puzzle that creates it. Other coins can then assert an announcement exists for inter-coin communication inside a block." },
    { name: "ASSERT_PUZZLE_ANNOUNCEMENT", id: 63, args: "(63 announcementID)", desc: "This spend is only valid if there was an announcement in this block matching the announcementID. The announcementID is the message that was announced concatenated with the puzzle hash of the coin that announced it announcementID == sha256(puzzle_hash + message)." },
    { name: "ASSERT_MY_COIN_ID", id: 70, args: "(70 coinID)", desc: "This spend is only valid if the presented coin ID is exactly the same as the ID of the coin that contains this puzzle." },
    { name: "ASSERT_MY_PARENT_ID", id: 71, args: "(71 parentID)", desc: "This spend is only valid if the presented parent coin info is exactly the same as the parent coin info of the coin that contains this puzzle." },
    { name: "ASSERT_MY_PUZZLEHASH", id: 72, args: "(72 puzzlehash)", desc: "This spend is only valid if the presented puzzle hash is exactly the same as the puzzle hash of the coin that contains this puzzle." },
    { name: "ASSERT_MY_AMOUNT", id: 73, args: "(73 amount)", desc: "This spend is only valid if the presented amount is exactly the same as the amount of the coin that contains this puzzle." },
    { name: "ASSERT_SECONDS_RELATIVE", id: 80, args: "(80 seconds)", desc: "This spend is only valid if the given time has passed since this coin was created. The coin's creation time or\"birthday\" is defined by the timestamp of the previous block not the actual block in which it was created. Similarly, the previous block's timestamp is used as the current time when evaluating these time locks." },
    { name: "ASSERT_SECONDS_ABSOLUTE", id: 81, args: "(81 time)", desc: "This spend is only valid if the timestamp on this block is greater than the specified timestamp. Again, the coin's birthday and the current time are defined by the timestamp of the previous block." },
    { name: "ASSERT_HEIGHT_RELATIVE", id: 82, args: "(82 block_age)", desc: "This spend is only valid if the specified number of blocks have passed since this coin was created." },
    { name: "ASSERT_HEIGHT_ABSOLUTE", id: 83, args: "(83 block_height)", desc: "This spend is only valid if the given block_height has been reached." },
  ].reduce((arr, cur) => ({ ...arr, [cur.id]: cur }), {});

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

  beautifyLisp(text: string): string {
    return beautifyLisp(text);
  }

  load(): void {
    const bd = localStorage.getItem("BUNDLE_DEBUG");
    if (bd) {
      this.bundleText = bd;
      this.updateBundle();
    }
  }

  save(): void {
    if (this.inputBundleText == this.bundleText) return;
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

    const conds = assemble(this.solution_result);
    const argarr = Array.from(conds.as_iter()).map(_ => Array.from(_.as_iter()).map(_ => disassemble(_)));
    this.solution_results = argarr.map(_ => ({ op: Number(_[0]), args: _.slice(1) }));
  }

  async uncurry(puz: string): Promise<void> {
    const curried = assemble(puz);
    const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
    const mods = disassemble(mod);
    const argarr = Array.from(args.as_iter()).map(_ => disassemble(_ as SExp));
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

  public sha256(...args: string[]): string {
    const cont = new Uint8Array(args.map(_ => Bytes.from(_, "hex").raw()).reduce((acc, cur) => [...acc, ...cur], [] as number[]));
    const result = Bytes.SHA256(cont);
    return prefix0x(result.hex());
  }
}
</script>

<style scoped lang="scss">
ul.args_list {
  list-style: inside square;
}

ul.args_list ul.args_list {
  margin-left: 2em;
}

ul.args_list.ellipsis-item > li {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.field ::v-deep textarea {
  font-size: 0.8em;
}

.puzzle-content {
  max-height: 10em;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
