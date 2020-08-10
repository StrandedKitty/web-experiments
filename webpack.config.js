const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const entries = {
    oit: "./src/oit/index.js"
};

const plugins = [];

for (const entryName of Object.keys(entries)) {
    plugins.push(
        new CopyPlugin({
            patterns: [
                {from: `*.html`, to: path.join(__dirname, `build/${entryName}`), context: `./src/${entryName}`},
                {from: `*.css`, to: path.join(__dirname, `build/${entryName}`), context: `./src/${entryName}`},
            ]
        })
    );
}

module.exports = {
    entry: entries,
    plugins: [
        new CleanWebpackPlugin(),
        ...plugins
    ],
    output: {
        path: path.join(__dirname, "build"),
        filename: "[name]/index.js"
    }
};