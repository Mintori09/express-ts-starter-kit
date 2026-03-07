import { HttpStatus } from 'src/common/constants'
import { UserLoginCredentials, UserSignUpCredentials } from './types'
import { TypedRequest } from 'src/types/request'
import * as argon2 from 'argon2'
import { Response, Request, NextFunction } from 'express'
import {
    clearRefreshTokenCookieConfig,
    config,
    prismaClient,
    refreshTokenCookieConfig,
} from 'src/config'
import * as authService from './auth.service'
import { Http } from 'winston/lib/winston/transports'

export const handleSignup = async (
    req: TypedRequest<UserSignUpCredentials>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { username, email, password, passwordConfirmed } = req.body

        if (!username || !email || !password || !passwordConfirmed) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Username, email and password are required!',
            })
        }

        if (password !== passwordConfirmed) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Password is not similiar!',
            })
        }

        const checkUserEmail = await authService.getUserByEmail(email)

        if (checkUserEmail)
            return res.status(HttpStatus.CONFLICT).json({
                message: 'Account is exist!',
            })

        await authService.createUser(req.body as UserSignUpCredentials)

        res.status(HttpStatus.CREATED).json({
            message: 'New user created',
        })
    } catch (error) {
        next(error)
    }
}

export const handleLogin = async (
    req: TypedRequest<UserLoginCredentials>,
    res: Response,
    next: NextFunction
) => {
    try {
        const cookies = req.cookies
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Email and password are required!',
            })
        }

        const user = await authService.getUserByEmail(email)

        if (!user) return res.sendStatus(HttpStatus.UNAUTHORIZED)

        if (!user.emailVerified) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message:
                    'Your email is not verified! Please confirm your email',
            })
        }

        const isPasswordValid = await argon2.verify(user.password, password)

        if (!isPasswordValid) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Invalid email or password',
            })
        }

        if (cookies?.[config.jwt.refresh_token.cookie_name]) {
            const refreshToken = cookies[config.jwt.refresh_token.cookie_name]
            const checkRefreshToken =
                await authService.getRefreshTokenByToken(refreshToken)

            if (!checkRefreshToken || checkRefreshToken.userId !== user.id) {
                await authService.deleteAllUserRefreshTokens(user.id)
            } else {
                await authService.deleteRefreshToken(refreshToken)
            }

            res.clearCookie(
                config.jwt.refresh_token.cookie_name,
                clearRefreshTokenCookieConfig
            )
        }

        const { accessToken, refreshToken } = await authService.createSession(
            user.id
        )

        res.cookie(
            config.jwt.refresh_token.cookie_name,
            refreshToken,
            refreshTokenCookieConfig
        )

        return res.json({
            accessToken,
        })
    } catch (error) {
        next(error)
    }
}

export const handleLogout = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const cookies = req.cookies

        if (!cookies[config.jwt.refresh_token.cookie_name]) {
            return res.sendStatus(HttpStatus.NO_CONTENT)
        }

        const refreshToken = cookies[config.jwt.refresh_token.cookie_name]
        const foundRft = await authService.getRefreshTokenByToken(refreshToken)

        if (!foundRft) {
            res.clearCookie(
                config.jwt.refresh_token.cookie_name,
                clearRefreshTokenCookieConfig
            )
            return res.sendStatus(HttpStatus.NO_CONTENT)
        }

        await authService.deleteRefreshToken(refreshToken)

        res.clearCookie(
            config.jwt.refresh_token.cookie_name,
            clearRefreshTokenCookieConfig
        )

        return res.sendStatus(HttpStatus.NO_CONTENT)
    } catch (error) {
        next(error)
    }
}

export const handleRefresh = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const refreshToken: string | undefined =
            req.cookies[config.jwt.refresh_token.cookie_name]

        if (!refreshToken) return res.sendStatus(HttpStatus.UNAUTHORIZED)

        res.clearCookie(
            config.jwt.refresh_token.cookie_name,
            clearRefreshTokenCookieConfig
        )

        const foundRefreshToken =
            await authService.getRefreshTokenByToken(refreshToken)

        if (!foundRefreshToken) {
            try {
                const payload = await authService.verifyToken(
                    refreshToken,
                    config.jwt.refresh_token.secret
                )
                await authService.deleteAllUserRefreshTokens(payload.userId)
            } catch (err) {
                // Ignore verify errors here, just forbidden
            }
            return res.sendStatus(HttpStatus.FORBIDDEN)
        }

        await authService.deleteRefreshToken(refreshToken)

        try {
            const payload = await authService.verifyToken(
                refreshToken,
                config.jwt.refresh_token.secret
            )

            if (foundRefreshToken.userId !== payload.userId) {
                return res.sendStatus(HttpStatus.FORBIDDEN)
            }

            const { accessToken, refreshToken: newRefreshToken } =
                await authService.createSession(payload.userId)

            res.cookie(
                config.jwt.refresh_token.cookie_name,
                newRefreshToken,
                refreshTokenCookieConfig
            )

            return res.json({ accessToken })
        } catch (err) {
            return res.sendStatus(HttpStatus.FORBIDDEN)
        }
    } catch (error) {
        next(error)
    }
}

export const getMe = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.payload?.userId

        if (!userId) {
            return res.sendStatus(HttpStatus.UNAUTHORIZED)
        }

        const user = await authService.getUserById(userId)

        if (!user) {
            return res.sendStatus(HttpStatus.NOT_FOUND)
        }

        const { password, ...userWithoutPassword } = user

        return res.status(HttpStatus.OK).json(userWithoutPassword)
    } catch (error) {
        next(error)
    }
}
