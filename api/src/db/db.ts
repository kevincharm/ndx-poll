import * as knex from 'knex'
import config from '../config'
import * as path from 'path'
import { Model } from 'objection'

const knexConfig: knex.Config = {
    client: 'pg',
    connection: {
        user: config.pgUser,
        password: config.pgPassword,
        host: config.pgHost,
        port: config.pgPort,
        database: config.pgDatabase,
        ssl: {
            rejectUnauthorized: false,
        },
    },
    migrations: {
        extension: 'ts',
        loadExtensions: ['.ts'],
        directory: path.resolve(__dirname, '../../migrations'),
    },
}

const db = knex(knexConfig)

Model.knex(db)

export default db
