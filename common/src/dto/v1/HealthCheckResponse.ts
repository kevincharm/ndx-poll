import * as zod from 'zod'
import { arrayToUnion } from '../../util/array-to-union'

export const statusCodes = ['up', 'down'] as const

export const HealthCheckResponseSchema = zod.object({
    status: zod.object({
        api: arrayToUnion(statusCodes),
        postgres: arrayToUnion(statusCodes),
    }),
    build: zod.object({
        env: zod.string(),
        branch: zod.string(),
        commit: zod.string(),
    }),
})

export type HealthCheckResponse = zod.infer<typeof HealthCheckResponseSchema>
