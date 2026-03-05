import { Request, Response, NextFunction } from 'express'
import type { ParsedQs } from 'qs'
import { SanitizeOptions } from '../../types/types'
import { sanitize } from '../../util/sanitize.util'

export const xssMiddleware = (options?: SanitizeOptions) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (req.body) {
            req.body = sanitize(req.body, options)
        }

        if (req.query) {
            req.query = sanitize(req.query, options) as ParsedQs
        }

        if (req.params) {
            req.params = sanitize(req.params, options) as Record<string, string>
        }

        next()
    }
}
