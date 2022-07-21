/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  outputDir: "dist/web",
  productionSourceMap: false,
  configureWebpack: {
    resolve: {
      alias: {
        clvm_tools$: path.resolve(__dirname, 'node_modules/clvm_tools/browser'),
      },
    },
  }
};