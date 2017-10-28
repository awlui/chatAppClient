// Exports ESlint webpack config. Eslint is default but also supports 
// TSLint by inserting {test: 'ts'} option

exports.lintjs = ({ test = 'js', include, exclude, options } = {}) => {
    return {
        module: {
            rules: [
            {
                test: test === 'ts' ? /\.ts$/ : /\.js$/,
                include,
                exclude,
                enforce: 'pre',
                loader: test === 'ts' ? 'tslint-loader' : 'eslint-loader',
                options,
            },
            ],
        }
    }
};