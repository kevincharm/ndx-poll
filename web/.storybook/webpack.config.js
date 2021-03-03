module.exports = ({ config }) => {
    // From: https://github.com/duncanleung/gatsby-typescript-emotion-storybook/blob/master/.storybook/webpack.config.js
    // use @babel/preset-react for JSX and env (instead of staged presets)
    config.module.rules[0].use[0].options.presets = [
        require.resolve('@babel/preset-react'),
        require.resolve('@babel/preset-env'),
    ]

    config.module.rules.push({
        test: /\.(ts|tsx)$/,
        loader: require.resolve('babel-loader'),
        options: {
            presets: [
                [
                    'react-app',
                    {
                        flow: false,
                        typescript: true,
                    },
                ],
                '@emotion/babel-preset-css-prop',
            ],
        },
    })
    config.resolve.extensions.push('.ts', '.tsx')

    return config
}
