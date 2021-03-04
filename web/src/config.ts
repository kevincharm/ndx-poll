const isProduction = process.env.NODE_ENV === 'production'

const config = {
    apiEndpoint: isProduction
        ? process.env.API_ENDPOINT || 'https://poll.indexed.finance'
        : 'http://127.0.0.1:3000',
}

export default config
