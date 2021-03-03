module.exports = {
    development: {
        client: 'postgresql',
        connection: {
            database: 'ndx_poll',
            user: 'username',
            password: 'password',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: __dirname + '/migrations',
        },
    },
}
