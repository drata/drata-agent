const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = env => {
    return {
        target: 'electron-main',
        entry: {
            main: path.join(__dirname, 'src', 'main', 'index.ts'),
            preload: path.join(
                __dirname,
                'src',
                'bridge',
                'renderer-bridge.ts',
            ),
        },
        output: {
            path: path.join(__dirname, 'dist'),
            filename: '[name].js',
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    include: /src/,
                    use: [{ loader: 'ts-loader' }],
                },
            ],
        },
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        mangle: false,
                    },
                }),
            ],
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env.TARGET_ENV': JSON.stringify(
                    env.targetEnv || 'LOCAL',
                ),
            }),
        ],
    };
};
