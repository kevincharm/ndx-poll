import * as Knex from 'knex'
import Poll from '../../models/Poll'
import Vote from '../../models/Vote'

const tables = [Poll.tableName, Vote.tableName]

/**
 * ONLY USE THIS FOR TESTS.
 * Performs unescaped TRUNCATE CASCADE sql query.
 * @param db
 */
export function truncateTables(db: Knex) {
    return Promise.all(tables.map((table) => db.raw(`truncate table "${table}" cascade`)))
}
