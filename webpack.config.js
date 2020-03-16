const path = require('path');
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
	entry: './src/FluxProvider.js',
	mode: 'production',
  output: {
		filename: 'flux.min.js',
		path: path.resolve(__dirname, 'dist'),
	},
	node: {
		fs: 'empty'
	},
  plugins: [
		new TerserPlugin({
			parallel: true,
			terserOptions: {
				ecma: 6,
			},
		}),
  ]
};