<template>
  <ul>
    <!-- <li v-else-if="isCons(value)">CONS</li> -->
    <!-- <li v-if="isCons(value)">CONS: {{ value.as_pair() }}</li> -->
    <li v-if="isAtom(value)" class="atom">
      <atom-box :atom="value.atom"></atom-box>
      <!-- {{ value.atom.hex() }}
      <span class="has-text-grey-light" v-if="keywords[value.atom.hex()]">{{ keywords[value.atom.hex()] }}</span> -->
    </li>

    <template v-else-if="arr">
      <!-- LIST: {{ value.list_len() }} -->
      <div>
        {{ arr[0] }}
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
      </div>
      <template v-if="!collapse">
        <li v-for="(item, idx) in arr[1]" :key="idx">
          <!-- {{ idx }}|{{ item }} -->
          <span v-if="isAtom(item)" class="atom">
            <div>
              <atom-box :atom="item.atom"></atom-box>
              <!-- {{ item.atom.hex() }}
            <span class="has-text-grey-light" v-if="keywords[item.atom.hex()]">{{ keywords[item.atom.hex()] }}</span> -->
            </div>
          </span>
          <s-exp-box v-else :value="item" :auto-collapse="autoCollapse == 1 ? 1 : autoCollapse - 1"></s-exp-box>
        </li>
      </template>
    </template>
    <!-- <template v-else-if="isCons(value)">
      CONS:
      <li v-for="(item, idx) in value.as_pair()" :key="idx">
        <s-exp-box :value="item"></s-exp-box>
      </li>
    </template> -->
    <li v-else>ELSE</li>
  </ul>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { SExp, isAtom, isCons } from "clvm";
import AtomBox from "@/components/AtomBox.vue";

@Component({
  components: {
    AtomBox,
  },
})
export default class SExpBox extends Vue {
  @Prop() private value!: SExp;
  @Prop() private autoCollapse!: number;

  private manualCollapse = false;

  mounted(): void {
    this.manualCollapse = this.autoCollapse == 1;
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
      return [type, Array.from(this.value.as_iter())];
    }
    catch (error) {
      if (this.isCons(this.value)) {
        return ["CONS", this.value.as_pair() ?? []];
      }
      else {
        console.warn("failed to parse", this.isCons(this.value), this.value, error)
        return null;
      }
    }
  }

  isAtom(obj: SExp): boolean { return isAtom(obj); }
  isCons(obj: SExp): boolean { return isCons(obj); }


}
</script>

<style scoped lang="scss">
// ul > li {
//   margin-left: 10px;
// }

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
</style>
