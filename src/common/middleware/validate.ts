import z, { AnyZodObject } from 'zod/v3'
import { RequireAtLeastOne } from '../../types/types'
import { NextFunction, Response, Request } from 'express'
import { HttpStatus } from '../constants'

type RequestValidationSchema = RequireAtLeastOne<
    Record<'body' | 'query' | 'params', AnyZodObject>
>

const validate =
    (schema: RequestValidationSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
        const combinedSchema = z.object(schema)
        const result = combinedSchema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        })

        if (result.success) {
            return next()
        }

        const errors = result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }))

        return res.status(HttpStatus.BAD_REQUEST).json({ errors })
    }

export default validate
