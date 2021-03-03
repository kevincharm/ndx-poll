import * as Knex from 'knex'

exports.up = async function (knex: Knex) {
    await knex.schema
        .createTable('Poll', (table) => {
            table.uuid('id').primary()
            table.text('author').index() // Author's eth address
            table.text('question')
            table.specificType('choices', 'text[]')
            table.text('description')
            table.boolean('isMultipleChoice')
            table.bigInteger('blockNumber')
            table.dateTime('createdAt')
            table.dateTime('modifiedAt')
            table.dateTime('expiresAt')
        })
        .then()

    await knex.schema
        .createTable('Vote', (table) => {
            table.uuid('id').primary()
            table.uuid('pollId').index().references('id').inTable('Poll').onUpdate('cascade')
            table.unique(['pollId', 'voter']) // Identifying superkey: ensures only 1 vote per wallet per poll
            table.text('voter').index() // Voter's eth address
            table.specificType('selections', 'integer[]') // What the voter chose
            table.text('receipt')
            table.text('tokenBalance') // balance at poll's block number, from GRT
            table.dateTime('createdAt')
        })
        .then()
}

exports.down = function (_knex: Knex): Promise<void> {
    return new Promise((_resolve, reject) => {
        reject(new Error('Down migrations are not supported!'))
    })
}
