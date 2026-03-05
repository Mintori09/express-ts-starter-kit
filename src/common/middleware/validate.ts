import * as z from 'zod'
import { RequireAtLeastOne } from 'src/types/types'
import { NextFunction, Response, Request } from 'express'
import { HttpStatus } from 'src/common/constants'

type RequestValidationSchema = RequireAtLeastOne<{
    body?: z.ZodObject<any, any>
    query?: z.ZodObject<any, any>
    params?: z.ZodObject<any, any>
}>

const validate = (schema: RequestValidationSchema) => {
    const combinedSchema = z.object(schema)

    return (req: Request, res: Response, next: NextFunction) => {
        const result = combinedSchema.safeParse({
            body: req.body,
            query: req.query,
            params: req.params,
        })

        if (result.success) {
            return next()
        }

        const errors = result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
        }))

        return res.status(HttpStatus.BAD_REQUEST).json({ errors })
    }
}

export default validate
