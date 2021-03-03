import * as React from 'react'
import { ethers } from 'ethers'
import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { Helmet } from 'react-helmet'
import { ThemeProvider } from 'emotion-theming'
import defaultTheme from './themes/default'
import { Routes, Route, Link } from 'react-router-dom'
import useUserStore from './store/user'
import { NavBar, NavBarItemProps } from './components/NavBar'
import { Logo } from './components/Logo'
// import { Register } from './screens/Register'
import { ErrorDisplay } from './components/ErrorDisplay'
import useErrorStore from './store/error'
import { LoadingBar } from './components/LoadingBar'
import useLoadingStore from './store/loading'
import { CreatePoll } from './screens/CreatePoll'
import { ViewPoll } from './screens/ViewPoll'

const injected = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42],
})

export const App: React.FunctionComponent = () => {
    const userStore = useUserStore()
    const [errors, dismissError] = useErrorStore((store) => [store.errors, store.dismissError])
    const [isLoading] = useLoadingStore((store) => [store.isLoading])
    const { activate, deactivate, active, account, library } = useWeb3React()

    React.useEffect(() => {
        // Try to connect to metamask on mount
        ;(async () => {
            await activate(injected)
        })()
    }, [])

    React.useEffect(() => {
        if (active && account && library) {
            const lib: ethers.providers.Web3Provider = library
            ;(async () => {
                const accountName = await lib.lookupAddress(account)
                userStore.connect(account, accountName)
            })()
        } else {
            userStore.disconnect()
        }
    }, [active])

    const logo = (
        <Link to="/">
            <Logo colour="black" />
        </Link>
    )

    const navItems: NavBarItemProps[] = [
        { kind: 'router-link', to: '/create-poll', content: <>Create Poll</> },
    ]
    if (userStore.status === 'authenticated') {
        navItems.push({
            kind: 'button',
            content: <>{userStore.accountName || (account && account.slice(0, 8) + '...')}</>,
            onClick: () => {
                deactivate()
            },
        })
    } else {
        navItems.push({
            kind: 'button',
            content: <>Connect</>,
            onClick: async () => {
                await activate(injected)
            },
        })
    }

    return (
        <>
            <Helmet defaultTitle="Indexed" titleTemplate="Indexed | %s">
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <meta charSet="utf-8" />
            </Helmet>
            <ThemeProvider theme={defaultTheme}>
                <NavBar logo={logo} navItems={navItems} />
                <ErrorDisplay errors={errors} dismissError={dismissError} />
                {isLoading && <LoadingBar />}
                <Routes>
                    <Route path="/">
                        <Route path="/create-poll">
                            <CreatePoll />
                        </Route>
                        <Route path="/polls/:id">
                            <ViewPoll />
                        </Route>
                    </Route>
                </Routes>
            </ThemeProvider>
        </>
    )
}
