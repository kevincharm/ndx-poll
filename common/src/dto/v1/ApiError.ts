import * as zod from 'zod'

/**
 * This validator doesn't work for class instances... (???)
 */
export const ApiErrorSchema = zod.object({
    /** Machine-readable code for errors that can be handled programmatically */
    code: zod.string(),
    /** Human-readable message describing the error */
    message: zod.string(),
})

export type ApiErrorResponse = zod.infer<typeof ApiErrorSchema>

export class ApiError extends Error {
    constructor(public code: string, public message: string) {
        super(message)
    }

    toJSON(): ApiErrorResponse {
        return {
            code: this.code,
            message: this.message,
        }
    }
}
