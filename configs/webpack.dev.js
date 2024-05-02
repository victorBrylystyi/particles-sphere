const path = require('path');
const HtmlPlugin = require('html-webpack-plugin');

const ROOT_DIR = path.resolve(__dirname, '../');

module.exports = {
  mode: 'development',
  entry: path.resolve(ROOT_DIR, 'src', 'index.ts'),
  output: {
    path: path.resolve(ROOT_DIR, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  plugins: [
    new HtmlPlugin({
      title: 'Webpack 5',
      template: path.resolve(ROOT_DIR, 'src', 'index.html')
    }),
  ],
  devServer: {
    static: {
      directory: path.join(ROOT_DIR, 'public'),
    },
    port: 3000,
  },
};