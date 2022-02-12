
export function beautifyLisp(lisp: string): string {
  let output = "";
  let indent = 0;
  const indentSpace = (indent: number) => {
    if (indent == 0) return "";
    return Array(indent * 2).fill(" ").join("");
  };
  for (let i = 0; i < lisp.length; i++) {
    const c = lisp[i];
    const nc = lisp[i + 1];
    const nnc = lisp[i + 2];
    output += c;

    switch (c) {
      case "(":
        indent += 1;
        break;

      case ")":
        indent -= 1;
        break;

      default:
        break;
    }

    switch (true) {
      case c == "(" && nc == "(":
        output += "\n";
        output += indentSpace(indent);
        break;
      case c == " " && nc == "(" && nnc == ")":
        output += "\n";
        output += indentSpace(indent);
        output += "()";
        i += 2;
        break;
      case c == " " && nc == "(":
        output += "\n";
        output += indentSpace(indent);
        break;

      default:
        break;
    }
  }

  return output;
}