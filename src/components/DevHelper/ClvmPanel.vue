<template>
  <div>
    <b-field label="ChiaLisp/CLVM/Hex">
      <b-input type="textarea" v-model="origin_cl" @input="updateCl()"></b-input>
    </b-field>
    <b-field :message="cl_type">
      <template #label>
        Translated
        <key-box icon="checkbox-multiple-blank-outline" :value="translated_cl" tooltip="Copy"></key-box>
        <b-button v-if="cl_type == 'clvm'" tag="a" size="is-small" @click="uncurry(origin_cl)">Uncurry</b-button>
        <span v-if="modsdict[origin_cl]" class="tag is-info is-light is-small">{{ modsdict[origin_cl] }}</span>
      </template>
      <b-input type="textarea" v-model="translated_cl" disabled></b-input>
      {{ cl_extra }}
    </b-field>
    <b-field v-if="uncurried_module">
      <template #label>
        Uncurried Result
        <key-box icon="checkbox-multiple-blank-outline" :value="uncurried_module" tooltip="Copy"></key-box>
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
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import puzzle from "@/services/crypto/puzzle";
import { modsdict } from "@/services/coin/mods";
import { assemble, disassemble } from "clvm_tools/clvm_tools/binutils";
import { uncurry } from "clvm_tools/clvm_tools/curry";
import { SExp, Tuple } from "clvm";

@Component({
  components: {
    KeyBox,
  },
})
export default class ClvmPanel extends Vue {
  public origin_cl = "";
  public cl_type: "hex" | "clsp" | "clvm" | "" = "";
  public translated_cl = "";
  public cl_extra = "";
  public uncurried_module = "";
  public uncurried_args: string[] = [];

  public readonly modsdict = modsdict;

  async updateCl(): Promise<void> {
    if (this.origin_cl.startsWith("0x") || this.origin_cl.startsWith("ff")) {
      this.cl_type = "hex";
      this.translated_cl = await puzzle.disassemblePuzzle(this.origin_cl);
      this.cl_extra = "";
    } else if (this.origin_cl.trim().indexOf("\n") == -1) {
      this.cl_type = "clvm";
      this.translated_cl = await puzzle.encodePuzzle(this.origin_cl);
      this.cl_extra = await puzzle.getPuzzleHashFromPuzzle(this.origin_cl);
    } else {
      this.cl_type = "clsp";
      this.translated_cl = await puzzle.compileRun(this.origin_cl);
      this.cl_extra = "";
    }
  }

  async uncurry(puz: string): Promise<void> {
    const curried = assemble(puz);
    const [mod, args] = uncurry(curried) as Tuple<SExp, SExp>;
    const mods = disassemble(mod);
    const argarr = Array.from(args.as_iter()).map((_) => disassemble(_ as SExp));
    this.uncurried_module = mods;
    this.uncurried_args = argarr;
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

.puzzle-content {
  max-height: 10em;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
