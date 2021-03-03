import { jsonDateReviver, isMaybeDate, sendRequest } from './send-request'
import { server } from '../lib/mock-server'
import { rest } from 'msw'
import * as zod from 'zod'
import { genRandomIntBetween } from '../lib/random'
import { ApiErrorResponse } from '../../../common/src/dto/v1'
import { ApiResponseError } from './errors'

// Some fake API DTOs
const MockRequestSchema = zod.object({
    username: zod.string(),
})

type MockRequest = zod.infer<typeof MockRequestSchema>
const MockResponseSchema = zod.object({
    foo: zod.string(),
})

type MockResponse = zod.infer<typeof MockResponseSchema>

describe('sendRequest', () => {
    afterEach(() => {
        server.resetHandlers()
    })

    describe('HTTP requests', () => {
        it('parses successful response correctly', async (ok) => {
            // Mock the API
            const endpoint = 'http://localhost:6969/test'
            server.use(
                rest.get(endpoint, (_req, res, ctx) =>
                    res(ctx.status(200), ctx.json({ foo: 'bar' }))
                )
            )

            const response: MockResponse = await sendRequest(
                'get',
                endpoint,
                {},
                (data: any): data is MockResponse => MockResponseSchema.check(data)
            )
            expect(response.foo).toEqual('bar')

            ok()
        })

        it('parses error response correctly', async (ok) => {
            expect.assertions(4)

            // Mock the API
            const endpoint = 'http://localhost:6969/test'
            server.use(
                rest.post(endpoint, (req, res, ctx) => {
                    const body = req.body as MockRequest
                    expect(MockRequestSchema.check(body)).toBeTruthy()
                    expect(body.username).toEqual('fredburger')

                    const httpStatusCode = genRandomIntBetween(400, 600)
                    const errResponse: ApiErrorResponse = {
                        code: 'randomly_generated_error',
                        message: 'An error was encountered!',
                    }
                    return res(ctx.status(httpStatusCode), ctx.json(errResponse))
                })
            )

            const request: MockRequest = {
                username: 'fredburger',
            }
            try {
                await sendRequest<MockRequest, MockResponse>(
                    'post',
                    endpoint,
                    request,
                    (data: any): data is MockResponse => MockResponseSchema.check(data)
                )
            } catch (err) {
                expect(err instanceof ApiResponseError).toBeTruthy()
                expect(err.debug).toEqual('[randomly_generated_error] An error was encountered!')
            }

            ok()
        })

        it('falls back to default error response when error does not validate to schema', async (ok) => {
            expect.assertions(4)

            // Mock the API
            const endpoint = 'http://localhost:6969/test'
            server.use(
                rest.post(endpoint, (req, res, ctx) => {
                    const body = req.body as MockRequest
                    expect(MockRequestSchema.check(body)).toBeTruthy()
                    expect(body.username).toEqual('fredburger')

                    const httpStatusCode = genRandomIntBetween(400, 600)
                    const invalidErrResponse = {
                        foo: 'lalalala',
                    }
                    return res(ctx.status(httpStatusCode), ctx.json(invalidErrResponse))
                })
            )

            const request: MockRequest = {
                username: 'fredburger',
            }
            try {
                await sendRequest<MockRequest, MockResponse>(
                    'post',
                    endpoint,
                    request,
                    (data: any): data is MockResponse => MockResponseSchema.check(data)
                )
            } catch (err) {
                expect(err instanceof ApiResponseError).toBeTruthy()
                expect(err.debug).toEqual('[unparseable_api_error] Unable to parse API error!')
            }

            ok()
        })
    })

    describe('JSON date revival', () => {
        it('recognises if a given string might be timestamp', () => {
            expect(isMaybeDate('2012-12-19T06:01:17.171Z')).toBeTruthy()
        })

        it('transforms valid ISO timestamps into JS Dates', () => {
            const parsed = JSON.parse('{"timestamp":"2012-12-19T06:01:17.171Z"}', jsonDateReviver)
            expect(parsed.timestamp).toBeInstanceOf(Date)
            expect(new Date(parsed.timestamp).getTime()).toEqual(1355896877171)
        })
    })
})
