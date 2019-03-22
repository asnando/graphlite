const path = require('path');
const webpack = require('webpack');

const MODE = 'production';
const DEVTOOL = 'source-map';

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "graphlite.js",
    path: path.resolve(__dirname, "dist"),
    library: "graphlite",
    libraryTarget: "umd"
  },
  mode: MODE,
  devtool: DEVTOOL,
  externals: {
    'react-native': 'react-native'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        WEBPACK_ENV: true,
      }
    }),
  ]
};