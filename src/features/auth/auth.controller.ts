import { HttpStatus } from 'src/common/constants'
import {
    TypedRequest,
    UserLoginCredentials,
    UserSignUpCredentials,
} from 'src/types/types'
import * as argon2 from 'argon2'
import { Response } from 'express'
import {
    clearRefreshTokenCookieConfig,
    config,
    prismaClient,
    refreshTokenCookieConfig,
} from 'src/config'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/util/sendEmail.util'
import { logger } from 'src/common/middleware'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/util/generateTokens.util'

export const handleSignup = async (
    req: TypedRequest<UserSignUpCredentials>,
    res: Response
) => {
    const { username, email, password, passwordConfirmed } = req.body

    if (!username || email || !password || !passwordConfirmed) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Username, email and password are required!',
        })
    }

    if (password !== passwordConfirmed) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Password is not similiar!',
        })
    }

    const checkUserEmail = await prismaClient.user.findUnique({
        where: {
            email,
        },
    })

    if (checkUserEmail)
        return res.sendStatus(HttpStatus.CONFLICT).json({
            message: 'Account is exist!',
        })

    try {
        const hashedPassword = await argon2.hash(password)
        const newUser = await prismaClient.user.create({
            data: {
                name: username,
                email,
                password: hashedPassword,
            },
        })

        const token = randomUUID()
        const expiresAt = new Date(Date.now() + 3600000)

        await prismaClient.emailVerificationToken.create({
            data: {
                token,
                expiresAt,
                userId: newUser.id,
            },
        })

        sendVerifyEmail(email, token)

        res.status(HttpStatus.CREATED).json({
            message: 'New user created',
        })
    } catch (error) {
        logger.error(`Create new user failed: ${error}`)
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: `Error: ${error}`,
        })
    }
}

export const handleLogin = async (
    req: TypedRequest<UserLoginCredentials>,
    res: Response
) => {
    const cookies = req.cookies
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Email and password are required!',
        })
    }

    const user = await prismaClient.user.findUnique({
        where: {
            email,
        },
    })

    if (!user) return res.sendStatus(HttpStatus.UNAUTHORIZED)

    if (!user.emailVerified) {
        res.status(HttpStatus.UNAUTHORIZED).json({
            message: 'Your email is not verified! Please confirm your email',
        })
    }

    const dummyPassword = 'dummy_password'
    const dummyHash = await argon2.hash(password)

    const userPasswordHash = user ? user.password : dummyHash

    try {
        const isPasswordValid = await argon2.verify(userPasswordHash, password)

        if (!user.emailVerified) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message:
                    'Your email is not verified! Please confirm your email!',
            })
        }

        if (!isPasswordValid) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid email or password',
            })
        }

        if (cookies?.[config.jwt.refresh_token.cookie_name]) {
            const checkRefreshToken =
                await prismaClient.refreshToken.findUnique({
                    where: {
                        token: cookies[config.jwt.refresh_token.cookie_name],
                    },
                })

            if (!checkRefreshToken || checkRefreshToken.userId !== user.id) {
                await prismaClient.refreshToken.deleteMany({
                    where: {
                        userId: user.id,
                    },
                })
            } else {
                await prismaClient.refreshToken.delete({
                    where: {
                        token: cookies[config.jwt.refresh_token.cookie_name],
                    },
                })
            }

            res.clearCookie(
                config.jwt.refresh_token.cookie_name,
                clearRefreshTokenCookieConfig
            )
        }
        const accessToken = createAccessToken(user.id)
        const newRefreshToken = createRefreshToken(user.id)

        await prismaClient.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: user.id,
            },
        })

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            newRefreshToken,
            refreshTokenCookieConfig
        )

        return res.json({
            accessToken,
        })
    } catch {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR)
    }
}
