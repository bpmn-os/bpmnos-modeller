var CopyPlugin = require('copy-webpack-plugin');

var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              [ '@babel/plugin-transform-react-jsx', {
                'importSource': '@bpmn-io/properties-panel/preact',
                'runtime': 'automatic'
              } ]
            ]
          }
        }
      },
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          "style-loader",
          "css-loader",
          "less-loader",
        ],
      },
      {
        test: /\.bpmn$/,
        use: {
          loader: 'raw-loader'
        }
      }
    ]
  },
  resolve: {
    mainFields: [
      'browser',
      'module',
      'main'
    ],
    alias: {
      'react': '@bpmn-io/properties-panel/preact/compat'
    },
/*
    modules: [
      'node_modules',
      absoluteBasePath
    ]
*/
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/index.html', to: '.' },
        { from: 'src/BPMNOS.svg', to: '.' },
        { from: 'node_modules/bpmn-js/dist/assets', to: 'vendor/bpmn-js/' },
        { from: 'node_modules/bpmn-js-properties-panel/dist/assets', to: 'vendor/bpmn-js-properties-panel/' },
        { from: 'node_modules/bpmn-js-bpmnlint/dist/assets/css', to: 'vendor/bpmn-js-bpmnlint/' },
        { from: 'node_modules/bpmn-js-token-simulation/assets/css', to: 'vendor/bpmn-js-token-simulation/' },
        { from: 'src/modules/resource/css', to: 'modules/resource/' },
      ]
    })
  ]
};
