import * as zod from 'zod'

export const IsoDateSchema = zod
    .string()
    /** ISO8601 date regex from ajv */
    .regex(
        /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i
    )

export type IsoDate = zod.infer<typeof IsoDateSchema>
