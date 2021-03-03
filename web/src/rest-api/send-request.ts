import * as zod from 'zod'
import { sha1 } from 'object-hash'
import { ethers } from 'ethers'
import merge from 'lodash.merge'
import { ApiResponseError } from './errors'
import { ApiErrorResponse, ApiErrorSchema } from '../../../common/src/dto/v1/ApiError'

/**
 * Auxiliary function to handle the common function of sending an API request,
 * validating the payload and throwing the necessary errors with descriptive messages.
 *
 * @param method HTTP verb - e.g. `get`, `patch`, `post`
 * @param url Fully formed URL of the API endpoint to send the request to
 * @param data The data to send as the request body.
 * @param responseValidator A function with a type guard that asserts that that
 *                          response from the API is of type `ResponseT`
 * @param config Extra config for the fetch request.
 */
export async function sendRequest<RequestT, ResponseT>(
    method: 'head' | 'get' | 'post' | 'patch' | 'put' | 'delete',
    url: string,
    data: RequestT | null,
    responseValidator: (data: any) => data is ResponseT,
    config?: RequestInit
): Promise<ResponseT> {
    try {
        method = method.toUpperCase() as any
        const requestOptions: RequestInit = merge(
            {
                method,
                headers: {
                    'Content-Type': 'application/json;charset=UTF-8',
                },
            },
            config
        )

        // HEAD or GET requests can't have bodies,
        // so we transform the body into search params if necessary.
        if (data !== null && typeof data === 'object') {
            if (method.toLowerCase() === 'head' || method.toLowerCase() === 'get') {
                const urlBuilder = new URL(url)
                for (const [key, value] of Object.entries(data)) {
                    urlBuilder.searchParams.append(key, value)
                }
                url = urlBuilder.href
            } else {
                Object.assign(requestOptions, {
                    body: JSON.stringify(data),
                })
            }
        }

        const fetchResponse = await fetch(url, requestOptions)
        const responseText = await fetchResponse.text()

        // Handle HTTP status != 2xx
        if (!fetchResponse.ok) {
            const errResponse: ApiErrorResponse = parseApiErrorOrDefault(responseText)
            throw new ApiResponseError(
                errResponse.code,
                errResponse.message,
                `[${errResponse.code}] ${errResponse.message}`
            )
        }

        const response: ResponseT | null =
            (!!responseText && JSON.parse(responseText, jsonDateReviver)) || null

        if (responseValidator(response)) {
            return response
        } else {
            throw new ApiResponseError(
                'malformed_data',
                'Received malformed API data!',
                `Data received: ${JSON.stringify(response)}`
            )
        }
    } catch (error) {
        console.error(error)
        throw error
    }
}

/**
 * Create Authorization header with given account, raw data and signed data
 *
 * @param account public key of signer
 * @param data raw data
 * @param signed signed data
 */
export async function createAuthHeader(
    requestBody: any,
    web3Provider: ethers.providers.Web3Provider
): Promise<Record<string, string>> {
    const accounts = await web3Provider.listAccounts()
    const account = accounts[0]
    const data = sha1(requestBody)
    const signed = await web3Provider.getSigner().signMessage(data)

    return {
        Authorization: `Bearer ${account.toLowerCase()}$${signed}`,
    }
}

/**
 * Helper function to create a type-guarded responseValidator based on a Schema.
 * @param schema
 */
export function createResponseValidator<T>(schema: zod.Schema<T>) {
    return (data: any): data is zod.infer<typeof schema> => {
        try {
            schema.check(data)
            return true
        } catch (err) {
            console.error(err)
            return false
        }
    }
}

export const emptyResponseValidator = (data: any): data is {} => true

/**
 * ***This is not intended as an exhaustive ISO timestamp validator!!!***
 * Ahem. This function provides a quick heuristic to determine if a given string
 * might be a timestamp that we could attempt to parse into a Date object.
 *
 * @param value string to test
 */
export function isMaybeDate(value: string): boolean {
    return Boolean(
        value.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)
    )
}

/**
 * Reviver for use with `JSON.parse` which transforms ISO timestamp strings back into
 * Date objects.
 *
 * Usage: `JSON.parse(obj, jsonDateReviver)`
 */
export function jsonDateReviver(_key: string, value: any): any {
    /** ISO Timestamp -> JS Date reviver */
    if (typeof value === 'string' && isMaybeDate(value)) {
        return new Date(value)
    }

    return value
}

function parseApiErrorOrDefault(input: string): ApiErrorResponse {
    try {
        const json = JSON.parse(input) as ApiErrorResponse
        return ApiErrorSchema.parse(json)
    } catch (err) {
        return {
            code: 'unparseable_api_error',
            message: 'Unable to parse API error!',
        }
    }
}
