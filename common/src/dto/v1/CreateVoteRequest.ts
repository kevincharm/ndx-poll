import * as zod from 'zod'

export const CreateVoteRequestSchema = zod.object({
    pollId: zod.string(),
    selections: zod.array(zod.number()),
})

export type CreateVoteRequest = zod.infer<typeof CreateVoteRequestSchema>
