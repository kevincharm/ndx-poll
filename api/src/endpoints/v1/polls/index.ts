import * as express from 'express'
import wrapAsyncMiddleware from '../../../lib/wrap-async-middleware'
import { bearerAuthMiddleware } from '../../../auth'
import getPoll from './get-poll'
import createPoll from './create-poll'
import submitVote from './submit-vote'

const router = express.Router()

/**
 * Top-level index routes. So for registering, logging in, etc.
 */
router.post('/:id/vote', bearerAuthMiddleware, wrapAsyncMiddleware(submitVote))
router.get('/:id', wrapAsyncMiddleware(getPoll))
router.post('/', bearerAuthMiddleware, wrapAsyncMiddleware(createPoll))

export default router
