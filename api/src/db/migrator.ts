import db from './db'
import log from '../lib/logger'

migrate()

async function migrate() {
    try {
        await db.migrate.latest()
        log.info('Migrations successful.')
    } catch (err) {
        log.error('Migrations failed!')
        log.error(err)
    }

    await db.destroy()
    log.info('Database connection successfully destroyed.')
}
