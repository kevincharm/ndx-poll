import * as zod from 'zod'

export const PasswordSchema = zod
    .string()
    .min(8, 'Password must have a minimum length of 8 characters')
