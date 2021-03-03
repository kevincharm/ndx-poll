import * as pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const level = process.env.LOG_LEVEL || 'info'

const logger = pino({
    prettyPrint: !isProduction,
    level,
})
export default logger
