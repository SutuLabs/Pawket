<template>
  <div>
    <b-field label="ChiaLisp/CLVM/Hex">
      <b-input type="textarea" v-model="origin_cl" @input="updateCl()"></b-input>
    </b-field>
    <b-field label="Translated" :message="cl_type">
      <b-input type="textarea" v-model="translated_cl" disabled></b-input>
      {{ cl_extra }}
    </b-field>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import KeyBox from "@/components/KeyBox.vue";
import puzzle from '@/services/crypto/puzzle';

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
}
</script>

<style scoped lang="scss">
</style>
