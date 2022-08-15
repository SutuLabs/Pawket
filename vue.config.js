/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { IgnorePlugin } = require('webpack');

module.exports = {
  outputDir: "dist/web",
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
    ],
  },
};