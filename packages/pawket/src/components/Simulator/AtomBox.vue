<template>
  <span class="atom">
    {{ value }}
    <breakpoint v-if="sexp" :value="sexp"></breakpoint>
    <span class="has-text-grey-light" v-if="keywords[value]">{{ keywords[value] }}</span>
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Bytes } from "clvm";
import { ConditionOpcode } from "@/services/coin/opcode";
import { SExpWithId } from "@/services/simulator/opVm";
import Breakpoint from "./Breakpoint.vue";

type KeyDict = { [key: string]: string };

@Component({
  components: {
    Breakpoint,
  },
})
export default class AtomBox extends Vue {
  @Prop() public atom!: Bytes;
  @Prop() public sexp!: SExpWithId;

  public conditionDict: KeyDict = {};

  public keywords: KeyDict = {};

  get value(): string {
    if (this.atom) {
      const hex = this.atom.hex();
      if (hex == "" && this.atom.raw()[0] == 0) return "00";
      if (hex == "" && this.atom.raw().length == 0) return "EMPTY";
      return hex;
    } else {
      return "NONE";
    }
  }

  mounted(): void {
    for (const key in ConditionOpcode) {
      if (Object.prototype.hasOwnProperty.call(ConditionOpcode, key)) {
        const opcode = (ConditionOpcode as unknown as { [key: string]: number })[key];
        this.conditionDict[Bytes.from([opcode]).hex()] = key;
      }
    }

    this.keywords = Object.assign({}, NAME_FROM_ATOM, this.conditionDict);
  }
}

export const NAME_FROM_ATOM = {
  "00": ".",
  // core opcodes 0x01-x08
  "01": "quote",
  "02": "apply",
  "03": "if",
  "04": "cons",
  "05": "first",
  "06": "rest",
  "07": "listp",
  "08": "exception(x)",
  // opcodes on atoms as strings 0x09-0x0f
  "09": "=",
  "0a": ">(bytes)",
  "0b": "sha256",
  "0c": "substr",
  "0d": "strlen",
  "0e": "concat",
  "0f": ".(0f)",
  // opcodes on atoms as ints 0x10-0x17
  "10": "+",
  "11": "-",
  "12": "*",
  "13": "/",
  "14": "divmod",
  "15": ">",
  "16": "shift_ext",
  "17": "shift_zero",
  // opcodes on atoms as vectors of bools 0x18-0x1c
  "18": "bit_and",
  "19": "bit_or",
  "1a": "bit_xor",
  "1b": "bit_not",
  "1c": ".(1c)",
  // opcodes for bls 1381 0x1d-0x1f
  "1d": "point_add",
  "1e": "pubkey_for_exp",
  "1f": ".(1f)",
  // bool opcodes 0x20-0x23
  "20": "not",
  "21": "any",
  "22": "all",
  "23": ".(23)",
  // misc 0x24
  "24": "softfork",
};
</script>

<style scoped lang="scss"></style>
