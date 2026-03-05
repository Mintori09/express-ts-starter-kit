import * as z from 'zod'

export const sendVerifyEmailSchema = {
    body: z.object({
        email: z.string().email('Email is invalid!'),
    }),
}
export const verifyEmailSchema = {
    params: z.object({
        token: z
            .string()
            .regex(
                /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
                'Invalid token format'
            ),
    }),
}
