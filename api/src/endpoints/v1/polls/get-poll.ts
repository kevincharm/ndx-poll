import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../../../../common/src/dto/v1/ApiError'
import Poll from '../../../models/Poll'
import Vote from '../../../models/Vote'
import { GetPollResponse } from '../../../../../common/src/dto/v1/GetPollResponse'
import { GetVoteResponse } from '../../../../../common/src/dto/v1/GetVoteResponse'
import { isZodError } from '../../../../../common/src/util/is-zod-error'

/**
 * Endpoint for retrieving polls (by ID).
 */
export default async function getPoll(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.id

        const poll = await Poll.findById(id)
        const votes: Vote[] = await Poll.relatedQuery('votes').for(poll.id).then()
        // DB schema => JSON DTO
        const safeVotes: GetVoteResponse[] = votes.map((vote) => ({
            id: vote.id,
            pollId: vote.pollId,
            voter: vote.voter,
            selections: vote.selections,
            receipt: vote.receipt,
            createdAt: vote.createdAt,
            tokenBalance: vote.tokenBalance,
        }))
        const resBody: GetPollResponse = {
            ...poll,
            votes: safeVotes,
        }

        res.status(200)
        return res.json(resBody)
    } catch (err) {
        if (isZodError(err)) {
            res.status(422)
            err = new ApiError('invalid_request', err.message)
        }
        return next(err)
    }
}
