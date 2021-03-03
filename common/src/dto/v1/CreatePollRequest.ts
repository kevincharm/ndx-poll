import * as zod from 'zod'

export const CreatePollRequestSchema = zod.object({
    question: zod.string(),
    choices: zod.array(zod.string()),
    description: zod.string(),
    isMultipleChoice: zod.boolean(),
    blockNumber: zod.number(),
})

export type CreatePollRequest = zod.infer<typeof CreatePollRequestSchema>
