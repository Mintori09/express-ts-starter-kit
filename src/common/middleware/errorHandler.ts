import { Response, Request, NextFunction } from 'express'
import { config } from 'src/config'
import { HttpStatus } from 'src/common/constants'
import logger from './logger'
import { ApiError } from 'src/utils/ApiError'

export const errorHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let { statusCode, message } = err

    if (!(err instanceof ApiError)) {
        statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR
        message = err.message || 'Internal Server Error'
    }

    res.locals.errorMessage = err.message

    const response = {
        success: false,
        message,
        ...(config.node_env === 'development' && { stack: err.stack }),
    }

    if (config.node_env === 'development') {
        logger.error(err)
    }

    res.status(statusCode).json(response)
}
