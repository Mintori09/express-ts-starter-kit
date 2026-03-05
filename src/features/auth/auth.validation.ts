import * as z from 'zod'
import validate from 'src/common/middleware/validate'
import { RequestValidationSchema } from 'src/types/types'

// We need to type the schemas to match what validate expects if inference fails
export const signupSchema: RequestValidationSchema = {
    body: z.object({
        email: z.string().email('Email is not valid!'),
        password: z.string().min(8).max(150),
        username: z.string().min(2).max(50),
    }),
}

export const loginSchema: RequestValidationSchema = {
    body: z.object({
        email: z.string().email('Email is not valid!'),
        password: z.string().min(6).max(150),
    }),
}
