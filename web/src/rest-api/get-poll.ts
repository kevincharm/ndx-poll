import config from '../config'
import { ethers } from 'ethers'
import { sendRequest, createResponseValidator } from './send-request'
import { GetPollResponse, GetPollResponseSchema } from './v1'

export async function getPollById(id: string): Promise<GetPollResponse> {
    const endpoint = new URL(`/v1/polls/${id}`, config.apiEndpoint).href

    return sendRequest(
        'get',
        endpoint,
        null,
        createResponseValidator(GetPollResponseSchema)
    ) as Promise<GetPollResponse>
}
