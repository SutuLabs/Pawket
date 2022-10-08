/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { IgnorePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devServer: {
    host: 'localhost'
  },
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
      new CopyWebpackPlugin([{ from: './static/pawket', to: './' }])
    ],
  },
  chainWebpack: config => {
    config.plugin('prefetch').tap(options => {
      options[0].fileBlacklist = options[0].fileBlacklist || []
      options[0].fileBlacklist.push(/mermaid(.)+?\.js$/)
      return options
    })
  },
};