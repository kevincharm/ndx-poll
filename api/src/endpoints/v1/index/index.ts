import * as express from 'express'
import healthCheck from './health-check'
import wrapAsyncMiddleware from '../../../lib/wrap-async-middleware'

const router = express.Router()

/**
 * Top-level index routes. So for registering, logging in, etc.
 */
router.get('/health-check', wrapAsyncMiddleware(healthCheck))

export default router
