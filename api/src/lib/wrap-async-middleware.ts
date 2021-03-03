import { Request, Response, NextFunction, RequestHandler } from 'express'

export default function wrapAsyncMiddleware(fn: RequestHandler) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next)
    }
}
