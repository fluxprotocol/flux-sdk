const path = require('path');
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
	entry: './src/FluxProvider.js',
	mode: 'production',
  output: {
		filename: 'flux.min.js',
		path: path.resolve(__dirname, 'dist'),
		library: "my-library",
    libraryTarget: "umd"
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