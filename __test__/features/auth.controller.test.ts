import { HttpStatus } from 'src/common/constants'
import {
    handleSignup,
    handleLogin,
    handleLogout,
    handleRefresh,
} from 'src/features/auth/auth.controller'
import { prismaClient, config } from 'src/config'
import * as argon2 from 'argon2'
import { Response, Request } from 'express'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import * as jwt from 'jsonwebtoken'

// Mock dependencies
jest.mock('../../src/config', () => ({
    prismaClient: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        emailVerificationToken: {
            create: jest.fn(),
            findUnique: jest.fn(),
            deleteMany: jest.fn(),
        },
        refreshToken: {
            findUnique: jest.fn(),
            create: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
    },
    config: {
        node_env: 'test',
        jwt: {
            refresh_token: {
                cookie_name: 'refresh_token',
                secret: 'secret',
            },
            access_token: {
                secret: 'secret',
            },
        },
    },
    refreshTokenCookieConfig: {},
    clearRefreshTokenCookieConfig: {},
}))

jest.mock('argon2')
jest.mock('node:crypto')
jest.mock('../../src/utils/sendEmail.util')
jest.mock('../../src/utils/generateTokens.util')
jest.mock('jsonwebtoken')

describe('Auth Controller', () => {
    let req: any
    let res: any

    beforeEach(() => {
        req = {
            body: {},
            cookies: {},
            params: {},
        }
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            sendStatus: jest.fn().mockReturnThis(),
            cookie: jest.fn().mockReturnThis(),
            clearCookie: jest.fn().mockReturnThis(),
        }
        jest.clearAllMocks()
    })

    describe('handleSignup', () => {
        it('should return 400 if required fields are missing', async () => {
            req.body = { username: 'test' }
            await handleSignup(req, res)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
        })

        it('should return 400 if passwords do not match', async () => {
            req.body = {
                username: 'test',
                email: 'test@example.com',
                password: 'password',
                passwordConfirmed: 'different',
            }
            await handleSignup(req, res)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
        })

        it('should return 409 if user already exists', async () => {
            req.body = {
                username: 'test',
                email: 'test@example.com',
                password: 'password',
                passwordConfirmed: 'password',
            }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' })
            await handleSignup(req, res)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CONFLICT)
        })

        it('should create a user and return 201', async () => {
            req.body = {
                username: 'test',
                email: 'test@example.com',
                password: 'password',
                passwordConfirmed: 'password',
            }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null)
            ;(argon2.hash as jest.Mock).mockResolvedValue('hashed')
            ;(prismaClient.user.create as jest.Mock).mockResolvedValue({ id: '1' })
            ;(randomUUID as jest.Mock).mockReturnValue('token')

            await handleSignup(req, res)

            expect(prismaClient.user.create).toHaveBeenCalled()
            expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED)
            expect(sendVerifyEmail).toHaveBeenCalled()
        })
    })

    describe('handleLogin', () => {
        it('should return 401 if user does not exist', async () => {
            req.body = { email: 'test@example.com', password: 'password' }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(null)
            ;(argon2.hash as jest.Mock).mockResolvedValue('dummy')

            await handleLogin(req, res)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        })

        it('should return 401 if password is invalid', async () => {
            req.body = { email: 'test@example.com', password: 'password' }
            const user = { id: '1', password: 'hashed', emailVerified: new Date() }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(false)

            await handleLogin(req, res)
            expect(res.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        })

        it('should login and return tokens if credentials are valid', async () => {
            req.body = { email: 'test@example.com', password: 'password' }
            const user = { id: '1', password: 'hashed', emailVerified: new Date() }
            ;(prismaClient.user.findUnique as jest.Mock).mockResolvedValue(user)
            ;(argon2.verify as jest.Mock).mockResolvedValue(true)
            ;(createAccessToken as jest.Mock).mockReturnValue('access')
            ;(createRefreshToken as jest.Mock).mockReturnValue('refresh')

            await handleLogin(req, res)

            expect(res.json).toHaveBeenCalledWith({ accessToken: 'access' })
            expect(res.cookie).toHaveBeenCalled()
        })
    })

    describe('handleLogout', () => {
        it('should return 204 if no refresh token in cookies', async () => {
            await handleLogout(req, res)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })

        it('should clear cookie and return 204 if token exists', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(prismaClient.refreshToken.findUnique as jest.Mock).mockResolvedValue({ token: 'token' })

            await handleLogout(req, res)

            expect(prismaClient.refreshToken.delete).toHaveBeenCalled()
            expect(res.clearCookie).toHaveBeenCalled()
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.NO_CONTENT)
        })
    })

    describe('handleRefresh', () => {
        it('should return 401 if no refresh token', async () => {
            await handleRefresh(req, res)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
        })

        it('should return 403 if token is not found in DB', async () => {
            req.cookies = { refresh_token: 'token' }
            ;(prismaClient.refreshToken.findUnique as jest.Mock).mockResolvedValue(null)
            ;(jwt.verify as any) = jest.fn((token, secret, callback) => callback(null, { userId: '1' }))

            await handleRefresh(req, res)
            expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
        })
    })
})
