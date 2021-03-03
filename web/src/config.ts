const isProduction = process.env.NODE_ENV === 'production'

const config = {
    apiEndpoint: isProduction ? 'https://ndx-poll.spicyme.me' : 'http://127.0.0.1:3000',
}

export default config
