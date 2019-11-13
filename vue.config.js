const webpack = require('webpack')
const fs = require('fs')
const packageJson = JSON.parse(fs.readFileSync('./package.json'))

module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
  ? '/'
  : '/',
  outputDir: './dist',
  devServer: {
    host: '0.0.0.0'
  },
  css: { extract: process.env.NODE_ENV === 'production' ? false : true },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          PACKAGE_VERSION: '"' + (packageJson.version || 0) + '"',
          name: '"' + (packageJson.name ? packageJson.name : 'vue-image-diff') + '"',
          issuesUrl: '"' + (packageJson.bugs ? (packageJson.bugs.url ? packageJson.bugs.url : '') : '') + '"',
          homepage: '"' + (packageJson.homepage ? packageJson.homepage : '') + '"'
        }
      })
    ]
  }
}