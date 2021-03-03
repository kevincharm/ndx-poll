import * as zod from 'zod'

/**
 * Convert a const array into a union-of-literals zod schema.
 *
 * @param array
 */
export function arrayToUnion<T extends string>(
    array: readonly [T, T, ...T[]]
): zod.ZodUnion<
    [
        zod.ZodLiteral<typeof array[number]>,
        zod.ZodLiteral<typeof array[number]>,
        ...zod.ZodLiteral<typeof array[number]>[]
    ]
> {
    return zod.union(
        array.map((s) => zod.literal(s)) as [
            zod.ZodLiteral<T>,
            zod.ZodLiteral<T>,
            ...zod.ZodLiteral<T>[]
        ]
    )
}
