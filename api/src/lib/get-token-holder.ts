import * as zod from 'zod'
import { request, gql } from 'graphql-request'
import { ApiError } from '../../../common/src/dto/v1/ApiError'

const query = gql`
    query getTokenHolder($id: String!, $blockNumber: Int!) {
        tokenHolder(id: $id, block: { number: $blockNumber }) {
            tokenBalance
        }
    }
`

const TokenHolderSchema = zod.object({
    /** from indexed.finance subgraph at GRT, regularly denominated */
    tokenBalance: zod.string(),
})

export type TokenHolder = zod.infer<typeof TokenHolderSchema>

export async function getTokenHolder(id: string, blockNumber: number): Promise<TokenHolder> {
    const data = await request(
        'https://api.thegraph.com/subgraphs/name/indexed-finance/indexed-governance',
        query,
        { id, blockNumber }
    )

    if (!data) {
        throw new ApiError('subgraph_unreachable', 'Could not reach the indexed.finance subgraph!')
    }
    if (!data.tokenHolder) {
        throw new ApiError('not_a_token_holder', `${id} is not a token holder!`)
    }
    if (!TokenHolderSchema.check(data.tokenHolder)) {
        throw new ApiError(
            'malformed_subgraph_data',
            'Received malformed subgraph data from The Graph!'
        )
    }

    return data.tokenHolder
}
