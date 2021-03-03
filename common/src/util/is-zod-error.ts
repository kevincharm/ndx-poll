import * as zod from 'zod'

/**
 * Hacky. Determines if `err` is a `ZodError`, even across different zod instances.
 */
export function isZodError(err: any): err is zod.ZodError {
    return err instanceof zod.ZodError || err.constructor?.name === zod.ZodError.name
}
