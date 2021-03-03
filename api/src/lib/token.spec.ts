import { createToken } from './token'

describe('Token generation util', () => {
    it('generates cryptorandom hashes with no dashes', () => {
        expect(createToken()).not.toContain('-')
    })
})
