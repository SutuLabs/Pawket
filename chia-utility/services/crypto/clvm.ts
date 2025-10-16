import { Clvm, Program, CurriedProgram, toHex, fromHex } from "chia-wallet-sdk-bundle";
import { unprefix0x } from "services/coin/condition";

export function assemble(s: string): Program {
  const clvm = new Clvm();
  return clvm.parse(s);
}

export function disassemble(p: Program): string {
  return p.unparse();
}

export function curry(p: Program, args: Program[]): Program {
  return p.curry(args);
}

export function uncurry(p: Program): CurriedProgram | undefined {
  return p.uncurry();
}

export function sha256tree(p: Program): string {
  return toHex(p.treeHash());
}

export const sexpAssemble = function (hexString: string): Program {
  const clvm = new Clvm();
  const bts = fromHex(unprefix0x(hexString));
  const program = clvm.deserialize(bts);
  return program;
};

/*
| from\to | clvm        | hex             | hash                | sexp         |
| --      | --          | --              | --                  | --           |
| clvm    | -           | opc             | opc -H              | assemble     |
| hex     | opd         | -               | ?                   | sexpAssemble |
| hash    | -           | -               | -                   | -            |
| sexp    | disassemble | .as_bin().hex() | sha256tree(_).hex() | -            |
*/
