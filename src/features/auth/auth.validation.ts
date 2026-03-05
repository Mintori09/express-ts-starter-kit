import * as z from 'zod'

export const signupSchema = {
    body: z.object({
        email: z.string().email('Email is not valid!'),
        password: z.string().min(8).max(150),
        username: z.string().min(2).max(50),
    }),
}

export const loginSchema = {
    body: z.object({
        email: z.string().email('Email is not valid!'),
        password: z.string().min(6).max(150),
    }),
}
