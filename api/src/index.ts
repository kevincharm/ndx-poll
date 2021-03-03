import * as http from 'http'
import app from './rest-api'
import { wss } from './websocket'
import config from './config'
import logger from './lib/logger'

try {
    const server = http.createServer(app)

    server.on('upgrade', (req, socket, head) => {
        wss.handleUpgrade(req, socket, head, (client) => {
            wss.emit('connection', client, req)
        })
    })

    server.listen(config.port, () => {
        logger.info(`HTTP server listening on ${config.port}...`)
    })
} catch (err) {
    logger.error(err)
    process.exit(1)
}
