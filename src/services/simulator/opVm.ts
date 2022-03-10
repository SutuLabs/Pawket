import {
  SExp,
  Tuple,
  CLVMType,
  TOperatorDict,
  None,
  TPreEvalF,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  to_pre_eval_op,
  PATH_LOOKUP_BASE_COST,
  PATH_LOOKUP_COST_PER_LEG,
  Bytes,
  t,
  PATH_LOOKUP_COST_PER_ZERO_BYTE,
  msb_mask,
  isCons,
  APPLY_COST,
  QUOTE_COST,
  isAtom,
  EvalError,
  OPERATOR_LOOKUP,
} from "clvm";
import { assemble } from "clvm_tools/clvm_tools/binutils";
import { cons, first, rest } from "./sexpExt";

export type ValStackType = idSExp[];
export type OpStackType = idOpType[];
export type opType = (op_stack: OpStackType, value_stack: ValStackType) => number;
export type OpType = "apply" | "cons" | "swap" | "eval";
export type idSExp = { sexp: SExp; id: number; };
export type idOpType = { op: OpType; id: number; };

export interface StepType {
  value_stack: ValStackType;
  op_stack: OpStackType;
  cost: number;
  result: CLVMType | None;
}

export interface SExpWithId extends SExp {
  id: number;
  breakpoint?: boolean;
}

export default class OpVm {
  value_stack: ValStackType = [];
  op_stack: OpStackType = [];
  cost = 0;
  result: CLVMType | None = None;

  steps: StepType[] = [];

  program: SExp | None = None;
  solution: SExp | None = None;

  pre_eval_f: TPreEvalF | None = None;
  operator_lookup: TOperatorDict = OPERATOR_LOOKUP;

  max_cost: number | None = None;

  puzzlecl = "";
  solutioncl = "";
  // started = false;


  private _uid = 10000;
  getuid(): number {
    this._uid = this._uid + 1;
    return this._uid;
  }

  start(puzzlecl: string, solutioncl: string): void {
    this.puzzlecl = puzzlecl;
    this.solutioncl = solutioncl;

    // this.started = true;
    this.program = assemble(this.puzzlecl);
    this.program = this.assignIdRecursive(this.program);

    this.solution = this.solutioncl ? assemble(this.solutioncl) : SExp.null();
    this.solution = this.assignIdRecursive(this.solution);

    // const [cost, result] = this.start_program(program, env);
    this.start_program(this.program, this.solution);
  }

  start_program(program: SExp, args: CLVMType): void {
    this.program = SExp.to(program);
    const firstStackValue = this.assignIdRecursive(program.cons(args));
    this.op_stack = [{ op: "eval", id: this.getuid() }];
    this.value_stack = [{ sexp: firstStackValue, id: this.getuid() }];
    this.cost = 0;
    this.result = None;
    this.steps = [];
  }

  assignIdRecursive(se: SExp): SExpWithId {
    if (!se) return se;
    const sexp = se as SExpWithId;
    if (!sexp.id) {
      sexp.id = this.getuid();
    } else {
      // assume sexp with id, all its children has id, avoid redundant recursive
      // return sexp;
    }
    if (sexp.atom) return sexp;
    if (isCons(sexp)) {
      const pair = sexp.pair;
      if (pair) {
        const [f, r] = pair;
        this.assignIdRecursive(f);
        this.assignIdRecursive(r);
        return sexp;
      }
    }

    throw new Error("Unknown status");
  }

  snapshot(): void {
    this.steps.push({
      op_stack: Array.from(this.op_stack),
      value_stack: Array.from(this.value_stack),
      cost: this.cost,
      result: this.result,
    });
  }

  prev_step(): void {
    if (this.steps.length == 0) {
      return;
    }

    const step = this.steps[this.steps.length - 1];
    this.op_stack = step.op_stack;
    this.value_stack = step.value_stack;
    this.cost = step.cost;
    this.result = step.result;
    this.steps.splice(this.steps.length - 1);
  }

  next_step(): void {
    if (!this.op_stack.length) {
      return;
    }

    this.snapshot();

    const opent = this.op_stack.pop() as idOpType;
    const op
      = opent.op == "apply" ? this.apply_op
        : opent.op == "swap" ? this.swap_op
          : opent.op == "cons" ? this.cons_op
            : opent.op == "eval" ? this.eval_op
              : null;
    if (op == null) throw new Error("unexpected op type: " + opent.op);

    const bop = op.bind(this);
    this.cost += bop(this.op_stack, this.value_stack);
    if (this.max_cost && this.cost > this.max_cost) {
      throw new EvalError("cost exceeded", SExp.to(this.max_cost));
    }
    this.result = this.value_stack[this.value_stack.length - 1]?.sexp;
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
      } else {
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
    value_stack.push({ sexp: this.assignIdRecursive(v1.sexp.cons(v2.sexp)), id: this.getuid() });
    return 0;
  }

  eval_op(op_stack: OpStackType, value_stack: ValStackType): number {
    // const pre_eval_op = this.pre_eval_f ? to_pre_eval_op(this.pre_eval_f, SExp.to) : None;
    // if (pre_eval_op) {
    //   pre_eval_op(op_stack, value_stack);
    // }

    const pairwrap = value_stack.pop() as idSExp;
    const pair = pairwrap.sexp;
    const sexp = first(pair);
    const args = rest(pair);

    const value_stackpush = (sexp: SExp): void => {
      value_stack.push({ id: this.getuid(), sexp: this.assignIdRecursive(sexp) });
    };

    const op_stackpush = (op: OpType): void => {
      op_stack.push({ id: this.getuid(), op });
    };

    // put a bunch of ops on op_stack
    if (!isCons(sexp)) {
      // sexp is an atom
      const [cost, r] = this.traverse_path(sexp, args) as [number, SExp];
      value_stackpush(r);
      return cost;
    }

    const operator = first(sexp);
    if (isCons(operator)) {
      const pair = operator.pair as Tuple<SExp, SExp>;
      const [new_operator, must_be_nil] = pair;
      if (new_operator.pair || !Bytes.NULL.equal_to(must_be_nil.atom)) {
        throw new EvalError("in ((X)...) syntax X must be lone atom", sexp);
      }
      const new_operand_list = rest(sexp);
      value_stackpush(new_operator);
      value_stackpush(new_operand_list);
      op_stackpush("apply");
      return APPLY_COST;
    }
    const op = operator.atom as Bytes;
    let operand_list = rest(sexp);
    // op === operator_lookup.quote_atom
    if (op.equal_to(this.operator_lookup.quote_atom)) {
      value_stackpush(operand_list);
      return QUOTE_COST;
    }

    op_stackpush("apply");
    value_stackpush(operator);
    while (!operand_list.nullp()) {
      const _ = first(operand_list);
      value_stackpush(cons(_, args));
      op_stackpush("cons");
      op_stackpush("eval");
      op_stackpush("swap");
      operand_list = rest(operand_list);
    }
    value_stackpush(SExp.null());
    return 1;
  }

  apply_op(op_stack: OpStackType, value_stack: ValStackType): number {
    const value_stackpush = (sexp: SExp): void => {
      value_stack.push({ id: this.getuid(), sexp: this.assignIdRecursive(sexp) });
    };

    const op_stackpush = (op: OpType): void => {
      op_stack.push({ id: this.getuid(), op });
    };

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
      if (operand_list.list_len() !== 2 || !operand_list.pair) {
        throw new EvalError("apply requires exactly 2 parameters", operand_list);
      }
      // const new_program = operand_list.first();
      const new_program = operand_list.pair[0];
      const new_args = first(rest(operand_list));
      value_stackpush(new_program.cons(new_args));
      op_stackpush("eval");
      return APPLY_COST;
    }

    const [additional_cost, r] = this.operator_lookup(op, operand_list) as [number, CLVMType];
    value_stackpush(r as SExp);
    return additional_cost;
  }
}