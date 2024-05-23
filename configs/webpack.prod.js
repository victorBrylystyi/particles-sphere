const path = require( 'path' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const HtmlPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

const ROOT_DIR = path.resolve(__dirname, '../');

module.exports = {
	entry: path.resolve(ROOT_DIR, 'src', 'index.ts'),
	mode: 'production',
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
	plugins: [
		new HtmlPlugin({
			title: 'Webpack 5',
			template: path.resolve(ROOT_DIR, 'src', 'index.html')
		}),
		new CopyPlugin({
			patterns: [
				{
					from: path.resolve(ROOT_DIR, 'dist', 'bundle.js'),
					to: path.resolve(ROOT_DIR, 'dist', 'bundle.txt')
				}
			]
		})
	],
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin( {
				terserOptions: {
					keep_classnames: false,
					keep_fnames: false,
					output: { comments: false },
					compress: { drop_console: true }
				},
				extractComments: false,
				test: /\.[jt]s(\?.*)?$/i
			} )
		]
	}
};
