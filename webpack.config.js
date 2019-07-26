const join = require('path').join;
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  plugins: [new CopyWebpackPlugin([{ from: 'src' }])],
  // entry: './src/index.js',
  output: {
    // path: join(__dirname, '/build'),
    filename: 'bundle.js',
  },
};
