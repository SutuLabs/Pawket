<template>
  <ul>
    <li v-if="isAtom(value)" class="atom">
      <atom-box :atom="value.atom" :sexp="value"></atom-box>
    </li>

    <template v-else-if="arr">
      <div :class="{ highlight: highlight }">
        {{ arr[0] }} {{ value.id }}
        <span v-if="collapse">
          <a href="javascript:void(0)" @click="unfold()">
            <b-icon icon="plus" size="is-small"></b-icon>
          </a>
        </span>
        <span v-else>
          <a href="javascript:void(0)" @click="fold()">
            <b-icon icon="minus" size="is-small"></b-icon>
          </a>
        </span>

        <breakpoint :value="value"></breakpoint>
      </div>
      <template v-if="!collapse">
        <li v-for="(item, idx) in arr[1]" :key="idx">
          <span v-if="isAtom(item)" class="atom">
            <div :class="{ highlight: highlightIds && highlightIds.indexOf(item.id) > -1 }">
              <atom-box :atom="item.atom" :sexp="item"></atom-box>
            </div>
          </span>
          <s-exp-box
            v-else
            :value="item"
            :auto-collapse="autoCollapse == 1 ? 1 : autoCollapse - 1"
            :highlight-ids="highlightIds"
          ></s-exp-box>
        </li>
      </template>
    </template>

    <li v-else>ELSE</li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { SExp, isAtom, isCons } from "clvm";
import AtomBox from "./AtomBox.vue";
import Breakpoint from "./Breakpoint.vue";
import { getIter } from "@/services/simulator/sexpExt";
import { SExpWithId } from "@/services/simulator/opVm";

@Component({
  components: {
    AtomBox,
    Breakpoint,
  },
  name: "SExpBox",
})
export default class SExpBox extends Vue {
  @Prop() public value!: SExpWithId;
  @Prop() public autoCollapse!: number;
  @Prop() public highlightIds!: number[];

  public manualCollapse = false;

  mounted(): void {
    this.manualCollapse = this.autoCollapse == 1;
  }

  get highlight(): boolean {
    if (!this.highlightIds) return false;
    return this.highlightIds.indexOf(this.value.id) > -1;
  }

  get collapse(): boolean {
    return this.manualCollapse;
  }

  fold(): void {
    this.manualCollapse = true;
  }

  unfold(): void {
    this.manualCollapse = false;
  }

  get arr(): [string, SExp[]] | null {
    if (this.isAtom(this.value)) return null;
    try {
      const type = this.isCons(this.value) ? "CONL" : "LIST";
      return [type, Array.from(getIter(this.value))];
    } catch (error) {
      if (this.isCons(this.value)) {
        return ["CONS", this.value.pair ?? []];
      } else {
        console.warn("failed to parse", this.isCons(this.value), this.value, error);
        return null;
      }
    }
  }

  isAtom(obj: SExp): boolean {
    return obj && isAtom(obj);
  }
  isCons(obj: SExp): boolean {
    return obj && isCons(obj);
  }
}
</script>

<style scoped lang="scss">
ul {
  padding: 0;
  margin: 0;
  list-style-type: none;
  position: relative;
}

li {
  list-style-type: none;
  border-left: 2px solid #000;
  margin-left: 1em;
}

li div {
  padding-left: 1em;
  position: relative;
}

li div::before {
  content: "";
  position: absolute;
  top: 0;
  left: -2px;
  bottom: 50%;
  width: 0.75em;
  border: 2px solid #000;
  border-top: 0 none transparent;
  border-right: 0 none transparent;
}

ul > li:last-child {
  border-left: 2px solid transparent;
}

div.highlight {
  background-color: #def;
}

.breakpoint {
  &.active {
    color: #e51400;
  }
  &.inactive {
    color: transparent;
  }
  &.inactive:hover {
    color: #f49c88;
  }
}
</style>
