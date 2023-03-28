<template>
  <div>
    <b-field label="ChiaLisp/CLVM/Hex">
      <b-input type="textarea" v-model="origin_cl" @input="updateCl()"></b-input>
    </b-field>
    <b-field :message="cl_type">
      <template #label>
        Translated
        <key-box icon="checkbox-multiple-blank-outline" :value="translated_cl" tooltip="Copy"></key-box>
        <span v-if="modsdict[origin_cl]" class="tag is-info is-light is-small">{{ modsdict[origin_cl] }}</span>
        <b-button v-if="cl_type == 'hex'" tag="a" size="is-small" @click="translated_cl = beautifyLisp(translated_cl)">
          <b-icon icon="format-paint"></b-icon>
        </b-button>
      </template>
      <b-input type="textarea" v-model="translated_cl" disabled></b-input>
      {{ cl_extra }}
    </b-field>
    <b-field
      v-if="cl_type == 'clsp' || cl_type == 'clvm'"
      label="Navigator Tester [by f(irst) or r(est)]"
      :message="navigateResult"
    >
      <b-input type="text" v-model="navigator" @input="updateNavigator()"></b-input>
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/Common/KeyBox.vue";
import puzzle from "@/services/crypto/puzzle";
import { modsdict } from "@/services/coin/mods";
import { beautifyLisp, findByPath } from "@/services/coin/lisp";
import { assemble, disassemble } from "clvm_tools";
import { unprefix0x } from "@/services/coin/condition";

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
  public navigator = "";
  public navigateResult = "";

  public readonly modsdict = modsdict;

  async updateCl(): Promise<void> {
    if (this.origin_cl.startsWith("0x") || this.origin_cl.startsWith("ff") || this.origin_cl.indexOf(" ") == -1) {
      this.cl_type = "hex";
      this.translated_cl = await puzzle.disassemblePuzzle(unprefix0x(this.origin_cl));
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

  async updateNavigator(): Promise<void> {
    this.navigator = this.navigator.replace(/[^fr]+/g, "");
    const program = assemble(this.origin_cl);
    const ret = findByPath(program, this.navigator);
    this.navigateResult = disassemble(ret);
  }

  beautifyLisp(text: string): string {
    return beautifyLisp(text);
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/arguments.scss";
</style>
