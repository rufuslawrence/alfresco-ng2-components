const webpack = require('webpack');
const helpers = require('./helpers');
const fs = require('fs');
const path = require('path');

module.exports = {
    entry: {
        "ng2-alfresco-core": "./ng2-alfresco-core/index.ts",
        "ng2-alfresco-datatable": "./ng2-alfresco-datatable/index.ts",
        "ng2-activiti-diagrams": "./ng2-activiti-diagrams/index.ts",
        "ng2-activiti-analytics": "./ng2-activiti-analytics/index.ts",
        "ng2-activiti-form": "./ng2-activiti-form/index.ts",
        "ng2-activiti-tasklist": "./ng2-activiti-tasklist/index.ts",
        "ng2-activiti-processlist": "./ng2-activiti-processlist/index.ts",
        "ng2-alfresco-documentlist": "./ng2-alfresco-documentlist/index.ts",
        "ng2-alfresco-login": "./ng2-alfresco-login/index.ts",
        "ng2-alfresco-search": "./ng2-alfresco-search/index.ts",
        "ng2-alfresco-tag": "./ng2-alfresco-tag/index.ts",
        "ng2-alfresco-upload": "./ng2-alfresco-upload/index.ts",
        "ng2-alfresco-viewer": "./ng2-alfresco-viewer/index.ts",
        "ng2-alfresco-webscript": "./ng2-alfresco-webscript/index.ts",
        "ng2-alfresco-userinfo": "./ng2-alfresco-userinfo/index.ts"
    },

    resolveLoader: {
        alias: {
            "file-multi-loader": path.resolve(__dirname, "./custom-loaders/file-loader-multi")
        }
    },

    output: {
        filename: '[name]/bundles/[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        chunkFilename: '[id].chunk.js'
    },

    // require those dependencies but don't bundle them
    externals: [
        /^\@angular\//,
        /^rxjs\//,
        'moment',
        'ng2-charts',
        'alfresco-js-api',
        'ng2-alfresco-core',
        'ng2-alfresco-datatable',
        'ng2-activiti-analytics',
        'ng2-activiti-diagrams'
    ],

    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader',
                exclude: [/node_modules/, /bundles/, /dist/, /demo/]
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                loader: 'tslint-loader',
                options: {
                    emitErrors: true,
                    configFile: './ng2-alfresco-core/tslint.json'
                },
                exclude: [/node_modules/, /bundles/, /dist/, /demo/]
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                use: 'source-map-loader',
                exclude: [/node_modules/, /bundles/, /dist/, /demo/]
            },
            {
                test: /\.ts$/,
                use: ['ts-loader', 'angular2-template-loader'],
                exclude: [/node_modules/, /bundles/, /dist/, /demo/]
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
                exclude: [/node_modules/, /bundles/, /dist/, /demo/]
            },
            {
                test: /\.css$/,
                loader: ['to-string-loader', 'css-loader'],
                exclude: [/node_modules/, /bundles/, /dist/, /demo/]
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file-multi-loader',
                query: {
                    name: '[name].[hash].[ext]',
                    outputPath: (url, resourcePath)=> {
                        return resourcePath.replace('src', 'bundles') + url;
                    },
                    publicPath: (url, resourcePath)=> {
                        var component = resourcePath.substring(0, resourcePath.indexOf('src'));
                        var path = resourcePath.replace(component, '').replace('src', 'bundles');
                        return './' + path + url;
                    }
                }
            }
        ]
    },

    resolve: {
        extensions: ['.ts', '.js'],
        symlinks: false,
        modules: [
            '../ng2-components', 'node_modules'
        ]
    },

    plugins: [
        new webpack.NoEmitOnErrorsPlugin(),

        new webpack.BannerPlugin(fs.readFileSync('./config/assets/license_header.txt', 'utf8')),

        // Workaround for angular/angular#11580
        new webpack.ContextReplacementPlugin(
            // The (\\|\/) piece accounts for path separators in *nix and Windows
            /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
            helpers.root('src'), // location of your src
            {} // a map of your routes
        ),

        new webpack.LoaderOptionsPlugin({
            htmlLoader: {
                minimize: false // workaround for ng2
            }
        })

    ],

    devtool: 'source-map',

    node: {
        fs: 'empty',
        module: false
    }
};
