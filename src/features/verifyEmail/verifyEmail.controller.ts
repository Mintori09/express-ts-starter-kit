import { Request, Response } from 'express'
import { EmailRequestBody, TypedRequest } from 'src/types/types'
import { HttpStatus } from 'src/common/constants'
import { prismaClient } from 'src/config'
import { randomUUID } from 'node:crypto'
import { sendVerifyEmail } from 'src/utils/sendEmail.util'

export const sendVerificationEmail = async (
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
        where: { email },
        select: {
            id: true,
            emailVerified: true,
        },
    })

    if (!user) {
        return res.status(HttpStatus.NOT_FOUND).json({
            error: 'Email not found!',
        })
    }

    if (user.emailVerified) {
        return res.status(HttpStatus.CONFLICT).json({
            error: 'Email already verified!',
        })
    }

    const existingToken = await prismaClient.emailVerificationToken.findFirst({
        where: {
            user: { id: user.id },
            expiresAt: { gt: new Date() },
        },
    })

    if (existingToken) {
        return res.status(HttpStatus.BAD_REQUEST).json({
            error: 'Verification email already sent!',
        })
    }

    const token = randomUUID()

    const expiresAt = new Date(Date.now() + 3600000)

    await prismaClient.emailVerificationToken.create({
        data: {
            token,
            expiresAt,
            userId: user.id,
        },
    })

    sendVerifyEmail(email, token)

    return res.status(HttpStatus.OK).json({
        message: 'Verification email sent!',
    })
}

export const handleVerifyEmail = async (req: Request, res: Response) => {
    const { token } = req.params as { token: string }

    if (!token) res.sendStatus(HttpStatus.NOT_FOUND)

    const verificationToken = await prismaClient.emailVerificationToken.findUnique({
        where: { token },
    })

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
        return res.status(HttpStatus.NOT_FOUND).json({
            error: 'Invalid or expired token!',
        })
    }

    await prismaClient.user.update({
        where: {
            id: verificationToken?.userId,
        },
        data: {
            emailVerified: new Date(),
        },
    })

    await prismaClient.emailVerificationToken.deleteMany({
        where: {
            userId: verificationToken.userId,
        },
    })

    return res.status(HttpStatus.OK).json({
        message: 'Email verification succesfully!',
    })
}
