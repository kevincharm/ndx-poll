import * as uuid from 'uuid'

export function createToken() {
    return [strippedUuid(), strippedUuid()].join('')
}

function strippedUuid() {
    return uuid.v4().replace(/-/g, '')
}
