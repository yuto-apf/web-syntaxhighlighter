const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin    = require("html-webpack-plugin");

module.exports = {
    // entry point
    entry: {
        main: `${__dirname}/src/ts/main.ts`  // __dirname: current directory
    },  

    // configuration of output files.
    output: {
        path: `${__dirname}/dst`,
        filename: '[name].js'  // In this time, [name] = main.
    },

    resolve: {
        extensions:['.ts','.js'],  // TS and JS are treated as module.
        alias: {
            '@': `${__dirname}/src/`,
        },
    },
    
    devServer: {
        // Open 'dst/index.html' automatically.
        static: {
            directory: `${__dirname}/dst`,
        },
        open: true,
    },

    module: {
        rules: [
            {
                // Apply TS compiler to files ending with '.ts'.
                test:  /\.ts$/,
                loader:'ts-loader'
            },
            {
                test: /\.(scss|sass|css)$/,
                use:  [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ]
            }
        ]
    },

    plugins: [
        new MiniCssExtractPlugin(),
        new HtmlWebpackPlugin({
            template:      `${__dirname}/src/index.html`,
            inject:        'body',  // insert <script> to just before <body>
            scriptLoading: 'defer'
        }),
    ]
}