import * as zod from 'zod'
import { GetVoteResponseSchema } from './GetVoteResponse'

export const GetPollResponseSchema = zod.object({
    id: zod.string(),
    author: zod.string(),
    question: zod.string(),
    choices: zod.array(zod.string()),
    description: zod.string(),
    isMultipleChoice: zod.boolean(),
    blockNumber: zod.number(),
    createdAt: zod.date(),
    modifiedAt: zod.date(),
    votes: zod.array(GetVoteResponseSchema),
})

export type GetPollResponse = zod.infer<typeof GetPollResponseSchema>
