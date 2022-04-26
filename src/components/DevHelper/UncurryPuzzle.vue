<template>
  <span>
    <span>
      <key-box icon="checkbox-multiple-blank-outline" :value="puzzle" tooltip="Copy"></key-box>
      <span v-if="modsdict[puzzle]" class="tag is-info is-light is-small">{{ modsdict[puzzle] }}</span>
      <template v-if="uncurriable">
        <b-button v-if="!showUncurry" tag="a" size="is-small" @click="showUncurry = true">Uncurry</b-button>
        <b-button v-if="showUncurry" tag="a" size="is-small" @click="showUncurry = false">Fold</b-button>
      </template>
      <div v-if="puzzle.length > 200" class="puzzle-content">
        {{ puzzle }}
      </div>
      <div v-else>{{ puzzle }}</div>
    </span>
    <ul v-if="showUncurry" class="args_list">
      <li>
        <span v-if="modsdict[uncurried_module]" class="tag is-info is-light is-small">{{ modsdict[uncurried_module] }}</span>
        <key-box icon="checkbox-multiple-blank-outline" :value="uncurried_module" tooltip="Copy"></key-box>
        <div v-if="puzzle.length > 200" class="puzzle-content">
          {{ uncurried_module }}
        </div>
        <div v-else>{{ uncurried_module }}</div>
      </li>
      <li v-for="(arg, i) in uncurried_args" :key="i">
        <b-tooltip v-if="params[i]" :label="params[i].desc ? params[i].desc : params[i].name" multilined>
          <span class="tag is-primary is-light is-small">{{ params[i].name }}</span>
        </b-tooltip>
        <uncurry-puzzle :puzzle="arg"></uncurry-puzzle>
      </li>
    </ul>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { SExp, Tuple } from "clvm";
import { ModParameter, modsdict, modsparams, modsprog } from "@/services/coin/mods";

@Component({
  components: {
    KeyBox,
  },
})
export default class UncurryPuzzle extends Vue {
  @Prop() private puzzle!: string;
  public uncurried_module = "";
  public uncurried_args: string[] = [];
  public uncurriable: boolean | null = null;
  public showUncurry = false;

  public readonly modsdict = modsdict;
  public readonly modsprog = modsprog;
  public readonly modsparams = modsparams;

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
      const curried = assemble(puz);
      const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
      const mods = disassemble(mod);
      const argarr = Array.from(args.as_iter()).map((_) => disassemble(_ as SExp));
      this.uncurried_module = mods;
      this.uncurried_args = argarr;
      this.uncurriable = true;
    } catch (err) {
      this.uncurriable = false;
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss"
</style>
