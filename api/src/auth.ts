import * as express from 'express'
import { sha1 } from 'object-hash'
import * as passport from 'passport'
import { Strategy as CustomStrategy } from 'passport-custom'
import log from './lib/logger'
import { ApiError } from '../../common/src/dto/v1/ApiError'
import { recoverPersonalSignature } from 'eth-sig-util'

const web3Strategy = new CustomStrategy(async (req, done) => {
    try {
        // Note: this strategy can't handle routes without a request body
        if (!req.body) {
            throw new Error('Requests without data are not supported!')
        }

        // The user must sign a SHA of the request body
        const data = sha1(req.body)
        if (!req.headers.authorization) {
            throw new Error('No auth header supplied!')
        }

        // Authorization: "Bearer <address>$<signed data>"
        // <signed data> is the SHA1 of the request body signed by <address>
        const [, hash] = req.headers.authorization.split(' ')
        const [address, sig] = hash.split('$')
        const recoveredAddress = recoverPersonalSignature({ data, sig })
        if (address.toLowerCase() === recoveredAddress.toLowerCase()) {
            done(null, { account: address })
        } else {
            throw new Error('Supplied address did not match signed data!')
        }
    } catch (err) {
        log.error(`Error while authenticating with Web3Strategy: ${err}`)
        done(new ApiError('invalid_bearer_token', 'HTTP bearer token is invalid.'))
    }
})

passport.use(web3Strategy)

passport.serializeUser((user, done) => {
    done(null, user)
})

passport.deserializeUser((user, done) => {
    done(null, user)
})

/**
 * Stateless authentication via HTTP bearer token.
 */
export const bearerAuthMiddleware: express.RequestHandler = passport.authenticate('custom', {
    session: false,
})

export default passport
