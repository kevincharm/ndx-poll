import * as uuid from 'uuid'
import * as zod from 'zod'
import { Model } from 'objection'

export const VoteObjectSchema = zod.object({
    id: zod.string(),
    pollId: zod.string(),
    voter: zod.string(), // Voter's eth address
    selections: zod.array(zod.number()), // What the voter chose
    receipt: zod.string(),
    tokenBalance: zod.string(),
    createdAt: zod.date(),
})

export class VoteNotFoundError extends Error {}

export default class Vote extends Model implements zod.infer<typeof VoteObjectSchema> {
    public id: string
    public pollId: string
    public voter: string
    public selections: number[]
    public receipt: string
    public tokenBalance: string
    public createdAt: Date

    /**
     * Helper to create a new Token model ready for database insertion. Does not automatically persist to db.
     */
    static create(fields: {
        id?: string
        pollId: string
        voter: string
        selections: number[]
        receipt: string
        tokenBalance: string
        createdAt: Date
    }) {
        const vote = new Vote()

        vote.id = fields.id || uuid.v4()
        vote.pollId = fields.pollId
        vote.voter = fields.voter
        vote.selections = fields.selections
        vote.receipt = fields.receipt
        vote.tokenBalance = fields.tokenBalance
        vote.createdAt = fields.createdAt
        return vote
    }

    static get tableName() {
        return 'Vote'
    }

    static get idColumn() {
        return 'id'
    }

    public static async findByPollId(pollId: string): Promise<Vote> {
        const vote = ((await this.query().where('pollId', pollId).first()) as any) as Vote | null
        if (!vote) {
            throw new VoteNotFoundError(`Vote not found!`)
        }

        return vote
    }

    public static async safeUpdate(vote: Partial<Vote>) {
        if (!vote.id) {
            throw new VoteNotFoundError('id of vote must be specified for update!')
        }

        // Delete things that are not user-updatable
        delete vote.createdAt
        return Vote.query().where('id', vote.id).update(vote).returning('*').first().then()
    }
}
