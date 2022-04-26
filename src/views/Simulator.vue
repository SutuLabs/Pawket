<template>
  <div class="simulator">
    <div class="puzzle_input" v-if="!started">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <div class="columns">
              <div class="column is-full">
                <b-field label="Example">
                  <b-select placeholder="Select a example" v-model="selectedExample" @input="setExample()">
                    <option v-for="(ex, idx) in examples" :value="ex" :key="idx">
                      {{ ex.name }}
                    </option>
                  </b-select>
                </b-field>
              </div>
            </div>
            <div class="columns">
              <div class="column is-half">
                <b-field label="Puzzle">
                  <b-input type="textarea" v-model="puzzlecl"></b-input>
                </b-field>
              </div>
              <div class="column is-half">
                <b-field label="Solution">
                  <b-input type="textarea" v-model="solutioncl"></b-input>
                </b-field>
              </div>
            </div>
            <div class="columns">
              <div class="column is-full">
                <b-button type="is-primary" @click="restart()">Analyze</b-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="started" class="">
      <div class="columns is-mobile">
        <div class="column is-half">
          <div class="program_tree">
            <s-exp-box v-if="program" :value="program" :auto-collapse="3" :highlight-ids="highlightIds"></s-exp-box>
          </div>
          <div class="program_tree">
            <s-exp-box v-if="solution" :value="solution" :highlight-ids="highlightIds"></s-exp-box>
          </div>
        </div>
        <div class="column is-half">
          <b-button type="is-light" @click="prev_step()">previous</b-button>
          <b-button type="is-primary" @click="next_step()">next</b-button>

          <b-dropdown :triggers="['hover']">
            <template #trigger>
              <b-button label="" type="is-info is-light" icon-right="dots-vertical" />
            </template>

            <b-dropdown-item type="is-danger" @click="restart()">restart</b-dropdown-item>
            <b-dropdown-item type="is-danger" @click="reset()">reset</b-dropdown-item>
          </b-dropdown>

          <div class="card">
            <div class="card-content">
              <div class="content">
                <transition-group v-if="op_stack.length > 0" class="op_stack" name="fade" tag="ul">
                  <li v-for="({ op, id }, idx) in op_stack.slice().reverse()" :key="id">
                    {{ op }}
                    <span class="is-size-7 has-text-grey-lighter">{{ op_stack.length - idx }}</span>
                  </li>
                </transition-group>
                <div v-else>
                  <span>Completed</span>
                </div>
              </div>
            </div>
          </div>

          <!-- <div class="card">
            <div class="card-content">
              <div class="content"> -->
          <transition-group class="value_stack" name="fade" tag="div">
            <div
              class="value_stack_item program_tree"
              v-for="(val, idx) in value_stack.slice().reverse()"
              :key="val.id"
              :class="{ active: idx < oppars.length }"
            >
              <b-taglist attached>
                <b-tag type="is-primary is-light">{{ val.id }}</b-tag>
                <b-tag type="is-primary is-light">{{ value_stack.length - idx }}</b-tag>
              </b-taglist>
              <b-tag type="is-info is-light" size="is-small" v-if="idx < oppars.length">
                {{ oppars[idx] }}
              </b-tag>
              <s-exp-box :value="val.sexp" :auto-collapse="3"></s-exp-box>
            </div>
          </transition-group>
          <!-- </div>
            </div>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { SExp, None } from "clvm";
import SExpBox from "@/components/Simulator/SExpBox.vue";
import OpVm, { OpStackType, SExpWithId, ValStackType } from "@/services/simulator/opVm";
import { first, rest } from "@/services/simulator/sexpExt";

interface ExampleType {
  name: string;
  puzzle: string;
  solution: string;
}

@Component({
  components: {
    SExpBox,
  },
})
export default class Home extends Vue {
  opvm: OpVm = new OpVm();
  get value_stack(): ValStackType {
    return this.opvm.value_stack;
  }
  get op_stack(): OpStackType {
    return this.opvm.op_stack;
  }
  // cost = 0;
  // result: CLVMType | None = None;

  get program(): SExp | None {
    return this.opvm.program;
  }
  get solution(): SExp | None {
    return this.opvm.solution;
  }

  puzzlecl = "";
  solutioncl = "";
  started = false;
  selectedExample: ExampleType | null = null;

  examples: ExampleType[] = [
    {
      name: "simple1",
      puzzle: "(a (q . q) (q . (2 3 4)))",
      solution: "()",
    },
    {
      name: "simplecalc1",
      puzzle: "(/ 2 5)",
      solution: "(80001 73)",
    },
    {
      name: "p2_delegated_puzzle_or_hidden_puzzle1",
      puzzle:
        "(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0xb5c7539888af59f601be0ea2eddd32c06a80d932170eec55ef7a7640cbc5b37b81c4258644229eca2322298a9bf0189f) 1))",
      solution: "(() (q (51 0x3eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc0 190)) ())",
    },
  ];

  get oppars(): string[] {
    if (this.op_stack.length == 0) {
      return [];
    }
    const opname = this.op_stack[this.op_stack.length - 1].op;
    const opdef = this.opdefs[opname];
    if (!opdef) {
      console.warn(`cannot find ${opname} for parameter naming.`);
      return [];
    }
    return opdef.parameters;
  }

  // steps:
  opdefs: { [key: string]: { parameters: string[] } } = {
    apply: { parameters: ["operand_list", "operator"] },
    cons: { parameters: ["v1", "v2"] },
    swap: { parameters: ["v1", "v2"] },
    eval: { parameters: ["(sexp, args)"] },
  };
  /*
  (sexp, args) => 
    atom sexp [idx] => (arg)
    sexp.f(op) =>
      cons op => apply(op.f, sexp.r)
      atom op == quote => (sexp.r)
      atom op == _ => apply(op,[swap+eval+cons(r,args) of r in sexp.r])
   */
  // async mounted(): Promise<void> {
  //   this.restart();
  // }

  get highlightIds(): number[] {
    const ss = this.value_stack.slice(this.value_stack.length - this.oppars.length, this.value_stack.length);
    const arr = ss.flatMap((_) => this.getAllIdsRecursive(_.sexp as SExpWithId));
    return arr;
  }

  getAllIdsRecursive(sexp: SExpWithId): number[] {
    const arr: number[] = [];
    arr.push(sexp.id);
    if (sexp.atom) return arr;
    arr.push(...this.getAllIdsRecursive(first(sexp) as SExpWithId));
    arr.push(...this.getAllIdsRecursive(rest(sexp) as SExpWithId));
    return arr;
  }

  setExample(): void {
    const example = this.selectedExample;
    if (!example) return;
    this.solutioncl = example.solution;
    this.puzzlecl = example.puzzle;
  }

  reset(): void {
    this.started = false;
  }

  restart(): void {
    this.started = true;
    this.opvm.start(this.puzzlecl, this.solutioncl);
  }

  prev_step(): void {
    this.opvm.prev_step();
  }

  next_step(): void {
    this.opvm.next_step();
  }
}
</script>

<style scoped lang="scss">
.value_stack_item {
  padding: 0.5em 0;
  border-bottom: 1px solid #ccc;
}
.program_tree {
  font-size: 0.8em;
  max-height: 300px;
  overflow: auto;
}
.op_stack {
  height: 200px;
  overflow: auto;
}
ul.op_stack {
  list-style: disc inside;
}
ul.op_stack > li:first-child {
  list-style-type: disclosure-closed;
  color: hsl(204, 71%, 39%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
.fade-move {
  transition: transform 1s;
}

.tags.has-addons {
  display: inline;
  padding-right: 0.5rem;
}
</style>
