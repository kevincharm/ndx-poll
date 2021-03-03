import * as express from 'express'
import index from './index/index'
import polls from './polls'

const router = express.Router()

/**
 * Here we define all the routes available in the v1 API.
 */

router.use('/', index)
router.use('/polls', polls)

export default router
