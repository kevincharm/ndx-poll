import { Request, Response, NextFunction } from 'express'
import db from '../../../db/db'
import logger from '../../../lib/logger'
import { HealthCheckResponse } from '../../../../../common/src/dto/v1/HealthCheckResponse'

export default async function healthCheck(req: Request, res: Response, next: NextFunction) {
    const response: HealthCheckResponse = {
        status: {
            api: 'up',
            postgres: await getPostgresStatus(),
        },
        build: {
            env: process.env.NODE_ENV || '',
            branch: process.env.GIT_BRANCH_NAME || '',
            commit: process.env.GIT_COMMIT_SHA || '',
        },
    }

    res.status(200)
    res.json(response)
}

async function getPostgresStatus(): Promise<HealthCheckResponse['status']['postgres']> {
    try {
        await db.raw('select 1+1 as result').then()
        return 'up'
    } catch (err) {
        logger.error(err)
        return 'down'
    }
}
