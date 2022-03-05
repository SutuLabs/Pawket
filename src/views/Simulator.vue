<template>
  <div class="simulator">
    <div class="">
      <div class="columns is-mobile">
        <div class="column is-half">
          <div class="program_tree">
            <s-exp-box v-if="program" :value="program" :auto-collapse="3"> </s-exp-box>
          </div>
          <div class="program_tree">
            <s-exp-box v-if="solution" :value="solution"> </s-exp-box>
          </div>
        </div>
        <div class="column is-half">
          <b-button type="is-light" @click="prev_step()">previous</b-button>
          <b-button type="is-success" @click="next_step()">next</b-button>
          <b-button type="is-danger" class="is-pulled-right" @click="restart()">restart</b-button>

          <div class="card">
            <div class="card-content">
              <div class="content">
                <!-- <ul class="op_stack"> -->
                <transition-group class="op_stack" name="fade" tag="ul">
                  <li v-for="({ op, id }, idx) in op_stack.slice().reverse()" :key="id">
                    {{ op.name }}
                    <span class="is-size-7 has-text-grey-lighter">{{ idx }}</span>
                  </li>
                </transition-group>
                <!-- </ul> -->
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
                <b-tag type="is-success is-light">{{ value_stack.length - idx }}</b-tag>
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
// import { Program, RunOptions, ProgramOutput, makeDefaultOperators, Instruction, instructions } from "@rigidity/clvm/src"
import {  SExp, Tuple, CLVMType, TOperatorDict, None, TPreEvalF, to_pre_eval_op, PATH_LOOKUP_BASE_COST,
  PATH_LOOKUP_COST_PER_LEG, Bytes, t, PATH_LOOKUP_COST_PER_ZERO_BYTE, msb_mask, isCons, APPLY_COST, QUOTE_COST, isAtom,
  EvalError, OPERATOR_LOOKUP} from "clvm";
// import {initialize } from 'clvm_tools';
import { assemble } from "clvm_tools/clvm_tools/binutils";
import SExpBox from "@/components/SExpBox.vue";
type ValStackType = idSExp[];
type OpStackType = idOpType[];
type opType = (op_stack: OpStackType, value_stack: ValStackType) => number;
type idSExp = { sexp: SExp, id: number };
type idOpType = { op: opType, id: number };

interface StepType {
  value_stack: ValStackType;
  op_stack: OpStackType;
  cost: number;
  result: CLVMType | None;
}

@Component({
  components: {
    SExpBox,
  },
})
export default class Home extends Vue {
  value_stack: ValStackType = []
  op_stack: OpStackType = [];
  cost = 0;
  result: CLVMType | None = None;

  steps: StepType[] = [];

  program: SExp | None = None;
  solution: SExp | None = None;

  pre_eval_f: TPreEvalF | None = None;
  operator_lookup: TOperatorDict = OPERATOR_LOOKUP;

  max_cost: number | None = None;
  // first_backward = false;

  private _uid = 100000;
  getuid(): number {
    this._uid = this._uid + 1;
    return this._uid;
  }

  get oppars(): string[] {
    const opname = this.op_stack[this.op_stack.length - 1].op.name;
    return this.opdefs[opname].parameters;
  }

  private getWrappedSExp(sexp: SExp): idSExp {
    return { id: this.getuid(), sexp };
  }

  private getWrappedStack(op: opType): idOpType {
    return { id: this.getuid(), op };
  }

  // steps:
  opdefs: { [key: string]: { parameters: string[] } } = {
    "bound apply_op": { parameters: ["operand_list", "operator"] },
    "bound cons_op": { parameters: ["v1", "v2"] },
    "bound swap_op": { parameters: ["v1", "v2"] },
    "bound eval_op": { parameters: ["(sexp, args)"] },
  };
    /*
    (sexp, args) => 
      atom sexp [idx] => (arg)
      sexp.f(op) =>
        cons op => apply(op.f, sexp.r)
        atom op == quote => (sexp.r)
        atom op == _ => apply(op,[swap+eval+cons(r,args) of r in sexp.r])
     */
  async mounted(): Promise<void> {
    this.restart();
  }

  restart(): void {

    // await clvm.initialize();
    // await initialize();

    // const { SExp, OPERATOR_LOOKUP, KEYWORD_TO_ATOM, h, t, run_program } = clvm;
    // const plus = h(KEYWORD_TO_ATOM["+"]);
    // const q = h(KEYWORD_TO_ATOM["q"]);
    // console.log(plus, q)
    // const str = "(a (q . q) (q . (2 3 4)))";
    const str = "(a (q 2 (q 2 (i 11 (q 2 (i (= 5 (point_add 11 (pubkey_for_exp (sha256 11 (a 6 (c 2 (c 23 ()))))))) (q 2 23 47) (q 8)) 1) (q 4 (c 4 (c 5 (c (a 6 (c 2 (c 23 ()))) ()))) (a 23 47))) 1) (c (q 50 2 (i (l 5) (q 11 (q . 2) (a 6 (c 2 (c 9 ()))) (a 6 (c 2 (c 13 ())))) (q 11 (q . 1) 5)) 1) 1)) (c (q . 0xb5c7539888af59f601be0ea2eddd32c06a80d932170eec55ef7a7640cbc5b37b81c4258644229eca2322298a9bf0189f) 1))";
    this.program = assemble(str);

    // const program = SExp.to([plus, 1, t(q, 175)]);
    // this.solution = SExp.null();
    this.solution = assemble("(() (q (51 0x3eb239190ce59b4af1e461291b9185cea62d6072fd3718051a530fd8a8218bc0 190)) ())");

    // console.log("puzzle", this.program, "solution", env);
    // const [cost, result] = this.start_program(program, env);
    this.start_program(this.program, this.solution);
    // console.log(this.cost, this.result);
  }

  start_program(
    program: SExp,
    args: CLVMType,
  ): void {
    this.program = SExp.to(program);
    this.op_stack = [{ op: this.eval_op, id: this.getuid() }];
    this.value_stack = [{ sexp: program.cons(args), id: this.getuid() }];
    this.cost = 0;
    this.result = None;
    this.steps = [];
    // this.snapshot();
  }

  snapshot(): void {
    this.steps.push({
      op_stack: Array.from(this.op_stack),
      value_stack: Array.from(this.value_stack),
      cost: this.cost,
      result: this.result,
    });
    // this.first_backward = true;
  }

  prev_step(): void {
    // if (this.first_backward) {
    //   this.first_backward = false;
    //   this.prev_step();
    // }
    if (this.steps.length == 0) {
      console.log("reach started");
      return;
    }

    const step = this.steps[this.steps.length - 1];
    // console.log(step);
    this.op_stack = step.op_stack;
    this.value_stack = step.value_stack;
    this.cost = step.cost;
    this.result = step.result;
    this.steps.splice(this.steps.length - 1);
  }

  next_step(): void {

    if (!this.op_stack.length) {
      console.log("End");
      return;
    }

    this.snapshot();

    const opent = this.op_stack.pop() as idOpType;
    this.cost += opent.op(this.op_stack, this.value_stack);
    if (this.max_cost && this.cost > this.max_cost) {
      throw new EvalError("cost exceeded", SExp.to(this.max_cost));
    }
    this.result = this.value_stack[this.value_stack.length - 1]?.sexp;
    // console.log(this.value_stack);
  }

  traverse_path(sexp: SExp, env: SExp): Tuple<number, SExp> {
    let cost = PATH_LOOKUP_BASE_COST;
    cost += PATH_LOOKUP_COST_PER_LEG;
    if (sexp.nullp()) {
      return t(cost, SExp.null());
    }

    const b = sexp.atom as Bytes;

    let end_byte_cursor = 0;
    while (end_byte_cursor < b.length && b.at(end_byte_cursor) === 0) {
      end_byte_cursor += 1;
    }

    cost += end_byte_cursor * PATH_LOOKUP_COST_PER_ZERO_BYTE;
    if (end_byte_cursor === b.length) {
      return t(cost, SExp.null());
    }

    // create a bitmask for the most significant *set* bit
    // in the last non-zero byte
    const end_bitmask = msb_mask(b.at(end_byte_cursor));

    let byte_cursor = b.length - 1;
    let bitmask = 0x01;
    while (byte_cursor > end_byte_cursor || bitmask < end_bitmask) {
      if (!isCons(env)) {
        throw new EvalError("path into atom", env);
      }
      if (b.at(byte_cursor) & bitmask) {
        env = env.rest();
      }
      else {
        env = env.first();
      }
      cost += PATH_LOOKUP_COST_PER_LEG;
      bitmask <<= 1;
      if (bitmask === 0x0100) {
        byte_cursor -= 1;
        bitmask = 0x01;
      }
    }
    return t(cost, env);
  }

  swap_op(op_stack: OpStackType, value_stack: ValStackType): number {
    const v2 = value_stack.pop() as idSExp;
    const v1 = value_stack.pop() as idSExp;
    value_stack.push(v2);
    value_stack.push(v1);
    return 0;
  }

  cons_op(op_stack: OpStackType, value_stack: ValStackType): number {
    const v1 = value_stack.pop() as idSExp;
    const v2 = value_stack.pop() as idSExp;
    value_stack.push({ sexp: v1.sexp.cons(v2.sexp), id: this.getuid() });
    return 0;
  }

  eval_op(op_stack: OpStackType, value_stack: ValStackType): number {
    // const pre_eval_op = this.pre_eval_f ? to_pre_eval_op(this.pre_eval_f, SExp.to) : None;
    // if (pre_eval_op) {
    //   pre_eval_op(op_stack, value_stack);
    // }

    const pairwrap = value_stack.pop() as idSExp;
    const pair = pairwrap.sexp;
    const sexp = pair.first();
    const args = pair.rest();

    const value_stackpush = (sexp: SExp): void => {
      value_stack.push({ id: this.getuid(), sexp });
    };

    const op_stackpush = (op: opType): void => {
      op_stack.push({ id: this.getuid(), op });
    }

    // put a bunch of ops on op_stack
    if (!isCons(sexp)) {
      // sexp is an atom
      const [cost, r] = this.traverse_path(sexp, args) as [number, SExp];
      value_stackpush(r);
      return cost;
    }

    const operator = sexp.first();
    if (isCons(operator)) {
      const pair = operator.as_pair() as Tuple<SExp, SExp>;
      const [new_operator, must_be_nil] = pair;
      if (new_operator.pair || !Bytes.NULL.equal_to(must_be_nil.atom)) {
        throw new EvalError("in ((X)...) syntax X must be lone atom", sexp);
      }
      const new_operand_list = sexp.rest();
      value_stackpush(new_operator);
      value_stackpush(new_operand_list);
      op_stackpush(this.apply_op);
      return APPLY_COST;
    }
    const op = operator.atom as Bytes;
    let operand_list = sexp.rest();
    console.log("atom op", op, operand_list);
    // op === operator_lookup.quote_atom
    if (op.equal_to(this.operator_lookup.quote_atom)) {
      value_stackpush(operand_list);
      return QUOTE_COST;
    }

    op_stackpush(this.apply_op);
    value_stackpush(operator);
    while (!operand_list.nullp()) {
      const _ = operand_list.first();
      value_stackpush(_.cons(args));
      op_stackpush(this.cons_op);
      op_stackpush(this.eval_op);
      op_stackpush(this.swap_op);
      operand_list = operand_list.rest();
    }
    value_stackpush(SExp.null());
    return 1;
  }

  apply_op(op_stack: OpStackType, value_stack: ValStackType): number {

    const value_stackpush = (sexp: SExp): void => {
      value_stack.push({ id: this.getuid(), sexp });
    };

    const op_stackpush = (op: opType): void => {
      op_stack.push({ id: this.getuid(), op });
    }

    const operand_list_wrap = value_stack.pop() as idSExp;
    const operator_wrap = value_stack.pop() as idSExp;
    const operand_list = operand_list_wrap.sexp;
    const operator = operator_wrap.sexp;

    if (!isAtom(operator)) {
      throw new EvalError("internal error", operator);
    }

    const op = operator.atom;
    // op === operator_lookup.apply_atom
    if (op.equal_to(this.operator_lookup.apply_atom)) {
      if (operand_list.list_len() !== 2) {
        throw new EvalError("apply requires exactly 2 parameters", operand_list);
      }
      const new_program = operand_list.first();
      const new_args = operand_list.rest().first();
      value_stackpush(new_program.cons(new_args));
      op_stackpush(this.eval_op);
      return APPLY_COST;
    }

    const [additional_cost, r] = this.operator_lookup(op, operand_list) as [number, CLVMType];
    value_stackpush(r as SExp);
    return additional_cost;
  }


  // public run(
  //   puzzle: Program,
  //   solution: Program,
  //   options: Partial<RunOptions> = {}
  // ): ProgramOutput {
  //   const fullOptions: RunOptions = {
  //     strict: false,
  //     operators: makeDefaultOperators(),
  //     ...options,
  //   };
  //   if (fullOptions.strict)
  //     fullOptions.operators.unknown = (_operator, args) => {
  //       throw new Error(
  //         `Unimplemented operator${args.positionSuffix}.`
  //       );
  //     };
  //   const instructionStack: Array<Instruction> = [instructions.eval];
  //   const stack: Array<Program> = [Program.cons(puzzle, solution)];
  //   let cost = 0n;
  //   while (instructionStack.length) {
  //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  //     const instruction = instructionStack.pop()!;
  //     cost += instruction(instructionStack, stack, fullOptions);
  //     if (fullOptions.maxCost !== undefined && cost > fullOptions.maxCost)
  //       throw new Error(
  //         `Exceeded cost of ${fullOptions.maxCost}${
  //         stack[stack.length - 1].positionSuffix
  //         }.`
  //       );
  //   }
  //   return {
  //     value: stack[stack.length - 1],
  //     cost,
  //   };
  // }
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
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
// .fade-leave-active {
//   transition: max-height 0.15s ease-out;
// }
// .fade-enter {
//   max-height: 0;
// }

.fade-move {
  transition: transform 1s;
}

// .fade-enter {
//   opacity: 0;
// }
// .fade-enter-active {
//   animation: slide-in 5s ease-out forwards;
// }
// .fade-leave-to, .fade-leave-active {
//   opacity: 0;
//   animation: slide-out 5s ease-out forwards;
// }
// @keyframes slide-in {
//   from { max-height: 0; } to { max-height: inherit; }
// }
// @keyframes slide-out {
//   from { max-height: inherit; } to { max-height: 0; }
// }
// @keyframes slide-in {
//   from { transform: translateY(0); } to { transform: translateY(-100%); }
// }
// @keyframes slide-out {
//   from { transform: translateY(-100%); } to { transform: translateY(0); }
// }
.tags.has-addons {
  display: inline;
  padding-right: 0.5rem;
}
</style>
