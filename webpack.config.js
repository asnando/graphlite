const path = require('path');
const webpack = require('webpack');

const entry = "./src/index.js";
const library = "graphlite";
const mode = "production";
const libraryTarget = "umd";
const devtool = "source-map";
const distPath = path.resolve(__dirname, "dist");

const webpackModule = {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: ["babel-loader"]
    }
  ]
};

const plugins = [
  new webpack.DefinePlugin({
    "process.env": {
      WEBPACK_ENV: true
    }
  }),
];

const webConfig = {
  target: 'web',
  entry,
  mode,
  devtool,
  module: webpackModule,
  plugins,
  output: {
    filename: "graphlite.js",
    path: distPath,
    library,
    libraryTarget
  },
  externals: {
    "react-native": "react-native"
  }
};

const nodeConfig = {
  target: 'node',
  entry,
  mode,
  devtool,
  module: webpackModule,
  plugins,
  output: {
    filename: "graphlite.node.js",
    path: distPath,
    library,
    libraryTarget
  }
};

module.exports = [
  webConfig,
  nodeConfig
];