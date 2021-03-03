// import * as uuid from 'uuid'
import * as request from 'supertest'
import app from '../../../rest-api'
import db from '../../../db/db'
import config from '../../../config'
import { truncateTables } from '../../../lib/__test/truncate-tables'
import { CreatePollRequest } from '../../../../../common/src/dto/v1/CreatePollRequest'
import { CreatePollResponse } from '../../../../../common/src/dto/v1/CreatePollResponse'
import Poll from '../../../models/Poll'

// Test signed message
const bearerToken = [
    '0x8fdB5B0265cCAbDd2b7b0a895D5fe133DcEdD1D4',
    '0x7c665652ef8855dd218d513968ba26e70ad7419f65a6cf286b9ec44e7e02eb1a5f6efa3ba1924b09b09624cbb5a5ce3a6f37cee0d62eaa9c09a0626b576deaf91c',
].join('$')

describe('Create poll route', () => {
    beforeAll(async () => {
        if (!config.pgDatabase.includes('test') || process.env.NODE_ENV === 'production') {
            throw new Error(
                'Please check that this test is not running in a production environment!'
            )
        }
    })
    beforeAll(async () => {
        await truncateTables(db)
    })
    afterEach(async () => {
        await truncateTables(db)
    })

    describe('POST /v1/polls', () => {
        it('should create new poll and return created poll after posting to endpoint with correctly signed request', async () => {
            const reqBody: CreatePollRequest = {
                blockNumber: 11961750,
                question: 'Which index is the bestest?',
                description: 'Choose which index is the best.',
                choices: ['CC10', 'DEFI5', 'DEGEN'],
                isMultipleChoice: false,
            }
            const res = await request(app)
                .post('/v1/polls')
                .set('Authorization', `Bearer ${bearerToken}`)
                .send(reqBody)
                .expect(200)
            const resBody: CreatePollResponse = res.body

            // Check that it's been inserted
            const createdPoll = await Poll.findById(resBody.id)
            expect(createdPoll.author).toEqual(
                '0x8fdB5B0265cCAbDd2b7b0a895D5fe133DcEdD1D4'.toLowerCase()
            )
        })

        it('should fail with 401 after posting to endpoint with incorrectly signed request', async () => {
            const reqBody: CreatePollRequest = {
                blockNumber: 11961750,
                question: 'Which index is the bestest?',
                description: 'Choose which index is the best.',
                choices: ['CC10', 'DEFI5', 'DEGEN', 'ORCL5'],
                isMultipleChoice: true,
            }
            await request(app)
                .post('/v1/polls')
                .set('Authorization', `Bearer ${bearerToken}`)
                .send(reqBody)
                .expect(401)
        })
    })
})
