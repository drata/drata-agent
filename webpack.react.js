const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

module.exports = env => {
    return {
        entry: {
            renderer: './src/renderer/index.tsx',
        },
        output: {
            path: __dirname + '/dist',
            filename: '[name].js',
        },
        target: 'web',
        devtool: 'source-map',
        devServer: {
            static: path.join(__dirname, 'dist'),
            compress: true,
            port: process.env.PORT || 3000,
            devMiddleware: {
                writeToDisk: process.platform === 'win32',
            },
            historyApiFallback: true,
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.(png|jpe?g|gif|svg)$/i,
                    loader: 'file-loader',
                    options: {
                        name: '[path][name].[ext]',
                        publicPath: '..',
                    },
                },
                {
                    test: /\.ts(x?)$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }],
                },
                {
                    test: /\.(woff|woff2|eot|ttf)$/i,
                    use: ['url-loader?limit=100000'],
                },
                {
                    test: /\.(s[ac]ss|css)$/i,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/renderer/index.html',
            }),
            new webpack.DefinePlugin({
                'process.env.TARGET_ENV': JSON.stringify(
                    env.targetEnv || 'LOCAL',
                ),
            }),
        ],
    };
};
