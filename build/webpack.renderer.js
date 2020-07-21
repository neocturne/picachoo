module.exports = {
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'fonts',
							publicPath: '../fonts',
						},
					},
				],
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.jsx'],
	},
};
