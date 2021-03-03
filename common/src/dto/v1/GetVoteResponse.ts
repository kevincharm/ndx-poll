import * as zod from 'zod'

export const GetVoteResponseSchema = zod.object({
    id: zod.string(),
    pollId: zod.string(),
    voter: zod.string(),
    selections: zod.array(zod.number()),
    receipt: zod.string(),
    tokenBalance: zod.string(),
    createdAt: zod.date(),
})

export type GetVoteResponse = zod.infer<typeof GetVoteResponseSchema>
