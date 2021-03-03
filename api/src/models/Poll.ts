import * as uuid from 'uuid'
import * as zod from 'zod'
import { Model } from 'objection'
import Vote from './Vote'

export const PollObjectSchema = zod.object({
    id: zod.string(),
    author: zod.string(),
    question: zod.string(),
    choices: zod.array(zod.string()),
    description: zod.string(),
    isMultipleChoice: zod.boolean(),
    blockNumber: zod.number(),
    createdAt: zod.date(),
    modifiedAt: zod.date(),
})

export class PollNotFoundError extends Error {}

export default class Poll extends Model implements zod.infer<typeof PollObjectSchema> {
    public id: string
    public author: string
    public question: string
    public choices: string[]
    public description: string
    public isMultipleChoice: boolean
    public blockNumber: number
    public createdAt: Date
    public modifiedAt: Date

    /**
     * Helper to create a new Token model ready for database insertion. Does not automatically persist to db.
     */
    static create(fields: {
        id?: string
        author: string
        question: string
        choices: string[]
        description: string
        isMultipleChoice: boolean
        blockNumber: number
        createdAt?: Date
        modifiedAt?: Date
    }) {
        const poll = new Poll()

        poll.id = fields.id || uuid.v4()
        poll.author = fields.author.toLowerCase()
        poll.question = fields.question
        poll.choices = fields.choices
        poll.description = fields.description
        poll.isMultipleChoice = fields.isMultipleChoice
        poll.blockNumber = fields.blockNumber
        const now = new Date()
        poll.createdAt = fields.createdAt || now
        poll.modifiedAt = fields.modifiedAt || now

        return poll
    }

    static get tableName() {
        return 'Poll'
    }

    static get idColumn() {
        return 'id'
    }

    static get relationMappings() {
        return {
            votes: {
                relation: Model.HasManyRelation,
                modelClass: Vote,
                join: {
                    from: `${this.tableName}.${this.idColumn}`,
                    to: `${Vote.tableName}.pollId`,
                },
            },
        }
    }

    public static async findById(id: string): Promise<Poll> {
        const poll = ((await this.query().where('id', id).first()) as any) as Poll | null
        if (!poll) {
            throw new PollNotFoundError(`Poll not found!`)
        }

        return poll
    }

    public static async safeUpdate(poll: Partial<Poll>) {
        if (!poll.id) {
            throw new PollNotFoundError('id of poll must be specified for update!')
        }

        // Delete things that are not user-updatable
        delete poll.createdAt
        poll.modifiedAt = new Date()
        // TODO: Should block number be updateable?
        delete poll.blockNumber
        return Poll.query().where('id', poll.id).update(poll).returning('*').first().then()
    }

    $parseDatabaseJson(json: any) {
        json.blockNumber = Number(json.blockNumber)
        return json
    }
}
