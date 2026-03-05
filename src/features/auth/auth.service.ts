import { prismaClient } from 'src/config'
import * as argon2 from 'argon2'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'
import {
    createAccessToken,
    createRefreshToken,
} from 'src/utils/generateTokens.util'
import { UserSignUpCredentials } from './types'
import * as jwt from 'jsonwebtoken'

export const createUser = async (data: UserSignUpCredentials) => {
    const hashedPassword = await argon2.hash(data.password)
    const newUser = await prismaClient.user.create({
        data: {
            name: data.username,
            email: data.email,
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

    sendVerifyEmail(data.email, token)
    return newUser
}

export const getUserByEmail = async (email: string) => {
    return prismaClient.user.findUnique({ where: { email } })
}

export const getRefreshTokenByToken = async (token: string) => {
    return prismaClient.refreshToken.findUnique({ where: { token } })
}

export const deleteRefreshToken = async (token: string) => {
    return prismaClient.refreshToken.deleteMany({ where: { token } })
}

export const deleteAllUserRefreshTokens = async (userId: string) => {
    return prismaClient.refreshToken.deleteMany({ where: { userId } })
}

export const createSession = async (userId: string) => {
    const accessToken = createAccessToken(userId)
    const refreshToken = createRefreshToken(userId)

    await prismaClient.refreshToken.create({
        data: {
            token: refreshToken,
            userId,
        },
    })

    return { accessToken, refreshToken }
}

export const verifyToken = (token: string, secret: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        (jwt as any).verify(token, secret, (err: any, payload: any) => {
            if (err) return reject(err)
            resolve(payload)
        })
    })
}
