/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const fs = require('fs')
const copyPlugin = require('copy-webpack-plugin')

// Generate pages object
const pages = {}

function getEntryFile(entryPath) {
  let files = fs.readdirSync(entryPath)
  return files
}

const chromeName = getEntryFile(path.resolve(`src/entry`))

function getFileExtension(filename) {
  return /[.]/.exec(filename) ? /[^.]+$/.exec(filename)[0] : undefined
}
chromeName.forEach((name) => {
  const fileExtension = getFileExtension(name)
  const fileName = name.replace('.' + fileExtension, '')
  pages[fileName] = {
    entry: `src/entry/${name}`,
    template: 'public/index.html',
    filename: `${fileName}.html`
  }
})

const isDevMode = process.env.NODE_ENV === 'development'
const outputDir = "dist/ext";

module.exports = {
  pages,
  outputDir,
  filenameHashing: false,
  chainWebpack: (config) => {
    config.plugins.delete('pwa');
    config.plugin('copy-manifest').use(new copyPlugin([{
      from: path.resolve(`src/manifest.${process.env.NODE_ENV}.json`),
      to: `${path.resolve(outputDir)}/manifest.json`
    }]));
    config.plugin('copy-icon').use(new copyPlugin([{
      from: path.resolve(`src/assets/icons`),
      to: `${path.resolve(outputDir)}/icons`
    }]));
  },
  configureWebpack: {
    output: {
      filename: `js/[name].js`,
      chunkFilename: `[name].js`
    },
    devtool: isDevMode ? 'inline-source-map' : false
  }
}