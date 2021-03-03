const isProduction = process.env.NODE_ENV === 'production'

const config = {
    apiEndpoint: isProduction ? 'https://api.poll.indexed.finance' : 'http://127.0.0.1:3000',
    wsEndpoint: isProduction ? 'wss://api.poll.indexed.finance' : 'ws://127.0.0.1:3000',
}

export default config
