import config from '../config'
import { ethers } from 'ethers'
import { sendRequest, createResponseValidator, createAuthHeader } from './send-request'
import { CreatePollRequest, CreatePollRequestSchema, CreatePollResponse } from './v1'

export async function createPoll(
    createPollRequest: CreatePollRequest,
    provider: ethers.providers.Web3Provider
): Promise<CreatePollResponse> {
    const endpoint = new URL(`/v1/polls`, config.apiEndpoint).href
    return sendRequest(
        'post',
        endpoint,
        createPollRequest,
        createResponseValidator(CreatePollRequestSchema),
        {
            headers: await createAuthHeader(createPollRequest, provider),
        }
    ) as Promise<CreatePollResponse>
}
