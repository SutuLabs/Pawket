export function first(sexp: Program): Program {
  const pair = sexp.pair;
  if (pair) {
    return pair[0] as Program;
  }
  throw new EvalError("first of non-cons", sexp);
}

export function rest(sexp: Program): Program {
  const pair = sexp.pair;
  if (pair) {
    return pair[1] as Program;
  }
  throw new EvalError("rest of non-cons", sexp);
}

export function cons(sexp: Program, right: Program): Program {
  return new Program({ pair: t(sexp, right), atom: null });
}

export function* getIter(sexp: Program): IterableIterator<Program> {
  let v: Program = sexp;
  while (!v.nullp()) {
    if (!v.pair) throw new EvalError("rest of non-cons", sexp);
    yield v.pair[0];
    v = v.pair[1];
  }
}
