import { Request, Response, NextFunction } from 'express'
import { EmailRequestBody, TypedRequest } from 'src/types/types'
import { HttpStatus } from 'src/common/constants'
import * as authService from 'src/features/auth/auth.service'
import * as verifyEmailService from './verifyEmail.service'

export const sendVerificationEmail = async (
    req: TypedRequest<EmailRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Email is required!',
            })
        }

        const user = await authService.getUserByEmail(email)

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

        const existingToken = await verifyEmailService.getExistingValidToken(user.id)

        if (existingToken) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                error: 'Verification email already sent!',
            })
        }

        await verifyEmailService.createVerificationToken(user.id, email)

        return res.status(HttpStatus.OK).json({
            message: 'Verification email sent!',
        })
    } catch (error) {
        next(error)
    }
}

export const handleVerifyEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token } = req.params as { token: string }

        if (!token) return res.sendStatus(HttpStatus.NOT_FOUND)

        const verificationToken = await verifyEmailService.getVerificationToken(token)

        if (!verificationToken || verificationToken.expiresAt < new Date()) {
            return res.status(HttpStatus.NOT_FOUND).json({
                error: 'Invalid or expired token!',
            })
        }

        await verifyEmailService.verifyUserEmail(verificationToken.userId)

        return res.status(HttpStatus.OK).json({
            message: 'Email verification succesfully!',
        })
    } catch (error) {
        next(error)
    }
}
