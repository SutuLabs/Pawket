/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const monacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const { IgnorePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  devServer: {
    host: 'localhost'
  },
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
      new CopyWebpackPlugin([{ from: './static/mixch', to: './' }]),
      new monacoWebpackPlugin()
    ],
    module: {
      rules: [
        {
          test: /\.dev\.ts$/i,
          use: 'raw-loader',
        },
      ],
    },
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