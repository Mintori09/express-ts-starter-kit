import { randomUUID } from 'node:crypto'
import { HttpStatus } from 'src/common/constants'
import * as argon2 from 'argon2'
import { prismaClient } from 'src/config'
import {
    EmailRequestBody,
    ResetPasswordRequestBodyType,
    TypedRequest,
} from 'src/types/types'
import { Response } from 'express'
import { sendResetEmail } from 'src/utils/sendEmail.util'

export const handleForgotPassword = async (
    req: TypedRequest<EmailRequestBody>,
    res: Response
) => {
    const { email } = req.body

    if (!email) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'Email is required!',
        })
    }

    const user = await prismaClient.user.findUnique({
        where: {
            email,
        },
    })

    if (!user || user.emailVerified) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
            message: 'Your email is not verified! Please confirm your email!',
        })
    }

    const resetToken = randomUUID()
    const expiresAt = new Date(Date.now() + 3600000)
    await prismaClient.resetToken.create({
        data: {
            token: resetToken,
            expiresAt,
            userId: user.id,
        },
    })

    sendResetEmail(email, resetToken)
    return res.status(HttpStatus.OK).json({
        message: 'Password reset email sent!',
    })
}

export const handleResetPassword = async (
    req: TypedRequest<ResetPasswordRequestBodyType>,
    res: Response
) => {
    const { token } = req.params
    const { newPassword } = req.body

    if (!token) return res.sendStatus(HttpStatus.NOT_FOUND)

    if (!newPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            message: 'New password is required!',
        })
    }

    const resetToken = await prismaClient.resetToken.findFirst({
        where: {
            token,
            expiresAt: { gt: new Date() },
        },
    })

    if (!resetToken) {
        return res.status(HttpStatus.NOT_FOUND).json({
            error: 'Invalid or expires token',
        })
    }

    const hashedPassword = await argon2.hash(newPassword)

    await prismaClient.user.update({
        where: {
            id: resetToken.userId,
        },
        data: {
            password: hashedPassword,
        },
    })

    await prismaClient.resetToken.deleteMany({
        where: {
            userId: resetToken.userId,
        },
    })

    await prismaClient.refreshToken.deleteMany({
        where: {
            userId: resetToken.userId,
        },
    })

    return res.status(HttpStatus.OK).json({
        message: 'Password reset successful!',
    })
}
