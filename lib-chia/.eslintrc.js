module.exports = {
    root: true,
    env: {
      node: true,
      es6: true,
      browser: true,
    },
    extends: [
      "eslint:recommended",
    ],
    parserOptions: {
      parser: "@typescript-eslint/parser",
      ecmaVersion: 2020,
      sourceType: "module"
    },
    rules: {
      "no-console": "off",
      "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  };