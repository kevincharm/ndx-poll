import '../node_modules/normalize.css/normalize.css' // webpack can suck a fat one
import '../src/index.css'
import { ThemeProvider } from 'emotion-theming'
import { addDecorator } from '@storybook/react'
import { withThemes } from '@react-theming/storybook-addon'
import defaultTheme from '../src/themes/default'

addDecorator(withThemes(ThemeProvider, [defaultTheme]))

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
}
