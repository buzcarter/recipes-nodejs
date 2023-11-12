const { resolve } = require('path');

module.exports = [{
  entry: {
    'recipeIndex.bundle.js': './src/static/scripts/indexApp.js',
  },
  output: {
    filename: '[name]',
    path: resolve(__dirname, './src/static/scripts'),
  },
  devtool: 'source-map',
}];
