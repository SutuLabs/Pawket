module.exports = {
    root: true,
    env: {
      node: true,
    },
    extends: [
      "eslint:recommended",
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module"
    },
    rules: {
      "no-console": "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  };