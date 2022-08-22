<template>
  <span>
    <span>
      <key-box icon="checkbox-multiple-blank-outline" :value="puzzle" tooltip="Copy"></key-box>
      <span v-if="modsdict[puzzle]" class="tag is-info is-light is-small">{{ modsdict[puzzle] }}</span>
      <template v-if="uncurriable">
        <b-button v-if="!showUncurry" tag="a" size="is-small" @click="showUncurry = true">Uncurry</b-button>
        <b-button v-if="showUncurry" tag="a" size="is-small" @click="showUncurry = false">Fold</b-button>
        <b-button tag="a" size="is-small" @click="copyStructure()">Copy Structure</b-button>
      </template>
      <div v-if="puzzle.length > 200" class="puzzle-content">
        <label>
          <key-box
            icon="checkbox-multiple-blank-outline"
            :value="puzzle_hash"
            :showValue="true"
            position="is-left"
            :delay="1000"
          ></key-box>
        </label>
        {{ puzzle }}
      </div>
      <div v-else>{{ puzzle }}</div>
    </span>
    <ul v-if="uncurriable && showUncurry" class="args_list">
      <li>
        <span v-if="modsdict[uncurried_module]" class="tag is-info is-light is-small">{{ modsdict[uncurried_module] }}</span>
        <key-box icon="checkbox-multiple-blank-outline" :value="uncurried_module" tooltip="Copy"></key-box>
        <div v-if="puzzle.length > 200" class="puzzle-content">
          <label>
            <key-box
              icon="checkbox-multiple-blank-outline"
              :value="uncurried_module_hash"
              :showValue="true"
              position="is-left"
              :delay="1000"
            ></key-box>
          </label>
          {{ uncurried_module }}
        </div>
        <div v-else>{{ uncurried_module }}</div>
      </li>
      <li v-for="(arg, i) in uncurried_args" :key="i">
        <b-tooltip v-if="params[i]" :label="params[i].desc ? params[i].desc : params[i].name" multilined>
          <span class="tag is-primary is-light is-small">{{ params[i].name }}</span>
        </b-tooltip>
        <uncurry-puzzle :puzzle="arg" :defaultShowUncurry="defaultShowUncurry"></uncurry-puzzle>
      </li>
    </ul>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { SExp, Tuple } from "clvm";
import { ModParameter, modsdict, modsparams, modsprog } from "@/services/coin/mods";
import puzzle from "@/services/crypto/puzzle";
import { CannotParsePuzzle, SimplePuzzle, simplifyPuzzle } from "@/services/coin/analyzer";
import { prefix0x } from "@/services/coin/condition";
import store from "@/store";

@Component({
  components: {
    KeyBox,
  },
  name: "UncurryPuzzle",
})
export default class UncurryPuzzle extends Vue {
  @Prop() public puzzle!: string;
  @Prop({ default: false }) public defaultShowUncurry!: boolean;
  public puzzle_hash = "";
  public uncurried_module = "";
  public uncurried_module_hash = "";
  public uncurried_args: string[] = [];
  public uncurriable: boolean | null = null;
  public showUncurry = false;

  public readonly modsdict = modsdict;
  public readonly modsprog = modsprog;
  public readonly modsparams = modsparams;

  beforeMount(): void {
    this.showUncurry = this.defaultShowUncurry;
  }

  mounted(): void {
    this.uncurry(this.puzzle);
  }

  beforeUpdate(): void {
    this.uncurry(this.puzzle);
  }

  get params(): ModParameter[] {
    return modsparams[modsdict[this.uncurried_module]] || [];
  }

  async uncurry(puz: string): Promise<void> {
    if (this.uncurriable != null) return;
    try {
      this.puzzle_hash = await puzzle.getPuzzleHashFromPuzzle(puz);
      const curried = assemble(puz);
      const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
      const mods = disassemble(mod);
      const argarr = Array.from(args.as_iter()).map((_) => disassemble(_ as SExp));
      this.uncurried_module = mods;
      this.uncurried_module_hash = await puzzle.getPuzzleHashFromPuzzle(mods);
      this.uncurried_args = argarr;
      this.uncurriable = true;
    } catch (err) {
      this.uncurriable = false;
    }
  }

  async copyStructure(): Promise<void> {
    const origin = assemble(this.puzzle);
    const all = await simplifyPuzzle(origin, this.puzzle);
    let output = "";
    var recOutput = async function (level: number, puz: SimplePuzzle | CannotParsePuzzle, paramName: string) {
      const indent = " ".repeat(level * 2);
      const pnhint = paramName ? `\`${paramName}\`: ` : "";
      if ("raw" in puz) {
        const hash = puz.raw.length > 100 ? ` **${prefix0x(await puzzle.getPuzzleHashFromPuzzle(puz.raw))}**` : "";
        output += `${indent}- ${pnhint}${puz.raw}${hash}\n`;
      } else {
        output += `${indent}- ${pnhint}\`${puz.mod}\`\n`;
        const pn = modsparams[puz.mod];
        for (let i = 0; i < puz.args.length; i++) {
          const arg = puz.args[i];
          await recOutput(level + 1, arg, pn?.[i].name.trim() ?? "");
        }
      }
    };

    await recOutput(0, all, "");
    store.dispatch("copy", output);
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";
</style>
