import * as uuid from 'uuid'
import UserError from '../lib/UserError'

/**
 * Error class representing API Response errors
 */
export class ApiResponseError extends Error implements UserError {
    public readonly name = 'APIResponseError'
    public readonly uid = uuid.v4()

    /**
     * Creates a new API Response Error instance
     *
     * @param message User-friendly message
     * @param debug Debug message
     */
    constructor(public code: string, message: string, public debug: string) {
        super(message)
        this.debug = debug
    }
}
