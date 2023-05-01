import { SExp, EvalError, t } from "clvm";

export function first(sexp: SExp): SExp {
  const pair = sexp.pair;
  if (pair) {
    return pair[0] as SExp;
  }
  throw new EvalError("first of non-cons", sexp);
}

export function rest(sexp: SExp): SExp {
  const pair = sexp.pair;
  if (pair) {
    return pair[1] as SExp;
  }
  throw new EvalError("rest of non-cons", sexp);
}

export function cons(sexp: SExp, right: SExp): SExp {
  return new SExp({ pair: t(sexp, right), atom: null });
}

export function* getIter(sexp: SExp): IterableIterator<SExp> {
  let v: SExp = sexp;
  while (!v.nullp()) {
    if (!v.pair) throw new EvalError("rest of non-cons", sexp);
    yield v.pair[0];
    v = v.pair[1];
  }
}