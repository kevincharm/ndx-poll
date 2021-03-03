const path = require('path')

module.exports = {
    stories: [
        '../src/components/**/*.stories.mdx',
        '../src/components/**/*.stories.@(js|jsx|ts|tsx)',
        '../src/screens/**/*.stories.mdx',
        '../src/screens/**/*.stories.@(js|jsx|ts|tsx)',
    ],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@react-theming/storybook-addon',
    ],
}
