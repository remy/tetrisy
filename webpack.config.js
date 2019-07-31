const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  plugins: [new CopyWebpackPlugin([{ from: 'src' }])],
  // entry: './src/index.js',
  output: {

    filename: 'bundle.js',
  },
};
