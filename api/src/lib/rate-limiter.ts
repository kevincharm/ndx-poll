import { RequestHandler } from 'express'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import { ApiError } from '../../../common/src/dto/v1/ApiError'

const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1, // per 1 second
})

const rateLimiterMiddleware: RequestHandler = (req, res, next) => {
    rateLimiter
        .consume(req.ip)
        .then(() => {
            next()
        })
        .catch(() => {
            res.status(429)
            res.json(new ApiError('rate_limited', 'Too many requests!').toJSON())
        })
}

export default rateLimiterMiddleware
