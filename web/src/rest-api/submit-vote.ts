import config from '../config'
import { ethers } from 'ethers'
import { sendRequest, createResponseValidator, createAuthHeader } from './send-request'
import { CreateVoteRequest, GetVoteResponse, GetVoteResponseSchema } from './v1'

export async function submitVote(
    submitVoteRequest: CreateVoteRequest,
    provider: ethers.providers.Web3Provider
): Promise<GetVoteResponse> {
    const endpoint = new URL(`/v1/polls/${submitVoteRequest.pollId}/vote`, config.apiEndpoint).href

    return sendRequest(
        'post',
        endpoint,
        submitVoteRequest,
        createResponseValidator(GetVoteResponseSchema),
        {
            headers: await createAuthHeader(submitVoteRequest, provider),
        }
    ) as Promise<GetVoteResponse>
}
