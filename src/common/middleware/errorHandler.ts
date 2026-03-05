import { Response, Request, NextFunction } from 'express'
import { config } from '../../config'
import { HttpStatus } from '../constants'

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    const statusCode = err.status | HttpStatus.INTERNAL_SERVER_ERROR
    console.error(`[Error] ${err.message}`)

    res.status(statusCode).json({
        success: false,
        message: err.message,
        stack: config.node_env === 'development' ? err.stack : undefined,
    })
}
