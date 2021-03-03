import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../../../../../common/src/dto/v1/ApiError'
import Vote from '../../../models/Vote'
import { CreateVoteRequestSchema } from '../../../../../common/src/dto/v1/CreateVoteRequest'
import { isZodError } from '../../../../../common/src/util/is-zod-error'
import Poll from '../../../models/Poll'
import { GetVoteResponse } from '../../../../../common/src/dto/v1/GetVoteResponse'
import { getTokenHolder } from '../../../lib/get-token-holder'

/**
 * Endpoint for submitting a vote entry.
 */
export default async function submitVote(req: Request, res: Response, next: NextFunction) {
    try {
        const user = (req.user || {}) as { account: string }
        const author = user.account // eth address, validated & passed in from auth.ts
        const { pollId, selections } = CreateVoteRequestSchema.parse(req.body)

        // Check that the poll exists
        // TODO: Should probably be in a transaction to be super safe
        const poll = await Poll.findById(pollId)

        // Check how much $NDX user is holding at this block number
        const tokenHolder = await getTokenHolder(author, poll.blockNumber)
        const tokenBalance = tokenHolder.tokenBalance

        // Pull receipt from auth header (signed request body)
        // TODO: This is duped from auth.ts
        const [, hash] = req.headers.authorization!.split(' ')
        const [, sig] = hash.split('$')

        const vote = Vote.create({
            pollId: poll.id,
            voter: author,
            selections,
            receipt: sig,
            tokenBalance,
            createdAt: new Date(),
        })
        await Vote.query().insert(vote)

        // DB schema => JSON DTO
        const resBody: GetVoteResponse = {
            id: vote.id,
            pollId: vote.pollId,
            receipt: vote.receipt,
            selections: vote.selections,
            voter: vote.voter,
            createdAt: vote.createdAt,
            tokenBalance,
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
