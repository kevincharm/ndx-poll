import * as zod from 'zod'

export const UsernameSchema = zod
    .string()
    .refine(
        (val) => Boolean(val.match(/[\p{Letter}\p{Number}]+/u)),
        'Username must contain only valid letters and/or numbers'
    )
    .max(39, 'Username must have a maximum length of 39 characters')
