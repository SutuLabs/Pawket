/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const monacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const { IgnorePlugin } = require('webpack');

module.exports = {
  outputDir: "dist/mixch",
  productionSourceMap: false,
  configureWebpack: {
    resolve: {
      alias: {
        clvm_tools$: path.resolve(__dirname, 'node_modules/clvm_tools/browser'),
      },
    },
    plugins: [
      new IgnorePlugin({
        checkResource(resource) {
          return /.*\/wordlists\/(?!english).*\.json/.test(resource)
        }
      }),
      new monacoWebpackPlugin()
    ],
    entry: "./src/mixch.ts",
  },
  chainWebpack: config => {
    config
        .plugin('html')
        .tap(args => {
            args[0].title = "Mixch - Pawket Developer";
            return args;
        })
}
};