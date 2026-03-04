import * as dotenv from 'dotenv'
import path from 'path'
import * as z from 'zod'

dotenv.config({
    path: path.resolve(__dirname, '../../.env'),
})

const envSchema = z.object({
    NODE_ENV: z
        .literal(['development', 'test', 'production'])
        .default('development'),
    PORT: z.string().default('4000'),
    CORS_ORIGIN: z.string().default('*'),
    ACCESS_TOKEN_SECRET: z
        .string()
        .min(8, 'ACCESS_TOKEN_SECRET require min 8 chars'),
    ACCESS_TOKEN_EXPIRE: z.string().default('20m'),
    REFRESH_TOKEN_SECRET: z
        .string()
        .min(8, 'ACCESS_TOKEN_SECRET require min 8 chars'),

    REFRESH_TOKEN_EXPIRE: z.string().default('1d'),
    REFRESH_TOKEN_COOKIE_NAME: z.string().default('min'),
    MYSQL_DATABASE: z.string(),
    MYSQL_ROOT_PASSWORD: z.string(),
    DATABASE_URL: z.string(),
    SMTP_HOST: z.string().regex(/^\d+$/, 'SMPT_PORT require number!'),
    SMTP_PORT: z.string(),
    SMTP_USERNAME: z.string(),
    SMTP_PASSWORD: z.string(),
    EMAIL_FROM: z.email('EMAIL NOT VALID!'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
    console.error('Configuration .env is not valid!')
    parsedEnv.error.issues.forEach((issue) => {
        console.log(` - [${issue.path.join('.')}]: ${issue.message}`)
    })
    process.exit(1)
}

const env = parsedEnv.data

const config = {
    node_env: env.NODE_ENV,
    server: {
        port: env.PORT,
    },
    cors: {
        cors_origin: env.CORS_ORIGIN,
    },
    jwt: {
        access_token: {
            secret: env.ACCESS_TOKEN_SECRET,
            expire: env.ACCESS_TOKEN_EXPIRE,
        },
        refresh_token: {
            secret: env.REFRESH_TOKEN_SECRET,
            expire: env.REFRESH_TOKEN_EXPIRE,
            cookie_name: env.REFRESH_TOKEN_COOKIE_NAME,
        },
    },
    email: {
        smtp: {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            auth: {
                username: env.SMTP_USERNAME,
                password: env.SMTP_PASSWORD,
            },
        },
    },
} as const

export default config
