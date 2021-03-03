import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../../../../common/src/dto/v1/ApiError'
import Poll from '../../../models/Poll'
import { CreatePollRequestSchema } from '../../../../../common/src/dto/v1/CreatePollRequest'
import { isZodError } from '../../../../../common/src/util/is-zod-error'

/**
 * Endpoint for creating polls.
 */
export default async function createPoll(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req.user || {}) as { account: string }
        const author = user.account // eth address, validated & passed in from auth.ts
        const {
            blockNumber,
            choices,
            description,
            isMultipleChoice,
            question,
        } = CreatePollRequestSchema.parse(req.body)

        const poll = Poll.create({
            author,
            blockNumber,
            choices,
            description,
            isMultipleChoice,
            question,
        })
        const insertedPoll = await Poll.query().insert(poll)

        res.status(200)
        return res.json(insertedPoll)
    } catch (err) {
        if (isZodError(err)) {
            res.status(422)
            err = new ApiError('invalid_request', err.message)
        }
        return next(err)
    }
}
