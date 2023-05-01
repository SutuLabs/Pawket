import * as monaco from "monaco-editor";

export function registerClspLanguage(): void {
  const languageId = "clsp";
  // Register a new language
  monaco.languages.register({ id: languageId });

  /* eslint-disable no-useless-escape */
  // Register a tokens provider for the language
  monaco.languages.setMonarchTokensProvider(languageId, {
    // Set defaultToken to invalid to see what you do not tokenize yet
    // defaultToken: 'invalid',

    defaultToken: "",
    // ignoreCase: true,
    tokenPostfix: ".clsp",

    brackets: [
      { open: "[", close: "]", token: "delimiter.square" },
      { open: "(", close: ")", token: "delimiter.parenthesis" },
      { open: "{", close: "}", token: "delimiter.curly" },
    ],

    constants: ["true", "false", "()"],

    numbers: /0[xX][0-9a-fA-F]+|-?[0-9]+/,

    characters:
      /^(?:\\(?:backspace|formfeed|newline|return|space|tab|o[0-7]{3}|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{4}|.)?(?=[\\\[\]\s"(),;@^`{}~]|$))/,

    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    // simple-namespace := /^[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*/
    // simple-symbol    := /^(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)/
    // qualified-symbol := (<simple-namespace>(<.><simple-namespace>)*</>)?<simple-symbol>
    qualifiedSymbols:
      /^(?:(?:[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*(?:\.[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)*\/)?(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)*(?=[\\\[\]\s"(),;@^`{}~]|$))/,

    controlKeywords: [
      ".",
      "a",
      "i",
      "x",
      "softfork",
      "if",
      "qq",
      "unquote",
      "mod",
      "defconstant",
      "defun-inline",
      "defun",
      "defmacro",
      "include",
      "list",
      "q",
      "c",
      "f",
      "r",
      "l",
    ],

    operators: [
      "substr",
      "strlen",
      "concat",
      "point_add",
      "pubkey_for_exp",
      "all",
      "any",
      "divmod",
      "logand",
      "logior",
      "logxor",
      "lognot",
      "ash",
      "lsh",
      "sha256",
      "not",
      "=",
    ],

    commonFunctions: ["assert", "sha256tree"],
    conditions: ["CREATE_COIN", "CREATE_PUZZLE_ANNOUNCEMENT", "ASSERT_COIN_ANNOUNCEMENT", "AGG_SIG_ME"],

    tokenizer: {
      root: [
        // whitespaces and comments
        { include: "@whitespace" },

        // numbers
        [/@numbers/, "number"],

        // characters
        [/@characters/, "string"],

        // strings
        { include: "@string" },

        // brackets
        [/[()\[\]{}]/, "@brackets"],

        // symbols
        [
          /@qualifiedSymbols/,
          {
            cases: {
              "@controlKeywords": "keyword",
              "@operators": "operators",
              "@commonFunctions": "operators.common",
              "@conditions": "tag",
              "@constants": "constant",
              "~[A-Z_][A-Z0-9_-]*": "constant",
              "@default": "identifier",
            },
          },
        ],
      ],

      whitespace: [
        [/[\s,]+/, "white"],
        [/;.*$/, "comment"],
        [/\(comment\b/, "comment", "@comment"],
      ],

      comment: [
        [/\(/, "comment", "@push"],
        [/\)/, "comment", "@pop"],
        [/[^()]/, "comment"],
      ],

      string: [[/"/, "string", "@multiLineString"]],

      multiLineString: [
        [/"/, "string", "@popall"],
        [/@escapes/, "string.escape"],
        [/./, "string"],
      ],
    },
  });
}

export function defineClspTheme(name?: string): void {
  // Define a new theme that contains only rules that match this language
  monaco.editor.defineTheme(name ?? "clspTheme", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "operators", foreground: "213EFF" },
      { token: "operators.common", foreground: "4060FF" },
    ],
    colors: {
    },
  });
}
