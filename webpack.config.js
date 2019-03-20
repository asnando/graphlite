const path = require('path');
const webpack = require('webpack');

const MODE = 'production';
const DEVTOOL = 'source-map';

const defaultPlugins = [
  new webpack.DefinePlugin({
    'process.env': {
      WEBPACK_ENV: true,
    }
  }),
];

const defaultConfig = {
  entry: './src/index.js',
  output: {
    filename: 'graphlite.min.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: MODE,
  devtool: DEVTOOL,
  module: {
  rules: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      use: ['babel-loader']
    }
  ]
  }
};

const webBundle = Object.assign({}, defaultConfig, {
  output: {
    filename: "graphlite.js",
    library: "graphlite",
    libraryTarget: "umd",
    path: path.join(__dirname, '/dist'),
  },
  mode: MODE,
  devtool: DEVTOOL,
  entry: {
    main: './src/index.js'
  },
  plugins: defaultPlugins
});

const reactNativeBundle = Object.assign({}, defaultConfig, {
  entry: './src/index.js',
  externals: {
    'react-native': 'react-native'
  },
  mode: MODE,
  devtool: DEVTOOL,
  output: {
    filename: "graphlite.js",
    library: "graphlite",
    libraryTarget: "umd",
    path: path.join(__dirname, '/dist/react-native'),
  },
  plugins: defaultPlugins
});

module.exports = [
  webBundle,
  reactNativeBundle
];