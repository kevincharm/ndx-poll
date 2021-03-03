import * as express from 'express'
import * as cors from 'cors'
import * as bodyParser from 'body-parser'
import * as qs from 'qs'
import * as expressPinoLogger from 'express-pino-logger'
import log from './lib/logger'
import passport from './auth'
import rateLimiterMiddleware from './lib/rate-limiter'
import v1 from './endpoints/v1'
import { ApiError } from '../../common/src/dto/v1/ApiError'

const app = express()
export default app

app.set('query parser', (query: string) => qs.parse(query))
app.use(expressPinoLogger({ logger: log }))
app.use(cors())
app.use(bodyParser.json())
app.use(passport.initialize())

// Enable rate-limiting if in production
if (process.env.NODE_ENV === 'production') {
    app.use(rateLimiterMiddleware)
}

// Expose available endpoints here
app.use('/v1', v1)

// Error handler - must be last in the middleware chain
const errorHandler: express.ErrorRequestHandler = (err, _req, res, next) => {
    if (!err) {
        return next()
    }

    log.error(err)
    res.status(res.statusCode >= 400 ? res.statusCode : 500)

    // Check if it's a known interface
    if (
        err instanceof ApiError ||
        (typeof err.code === 'string' && typeof err.message === 'string')
    ) {
        if (err.code === 'invalid_bearer_token') {
            res.status(401)
        }
        // Don't potentially leak extraneous fields
        res.json({
            message: err.message,
            code: err.code,
        })
    } else {
        res.json({
            message: 'Unknown server error',
            code: 'unknown_server_error',
        })
    }
}
app.use(errorHandler)
