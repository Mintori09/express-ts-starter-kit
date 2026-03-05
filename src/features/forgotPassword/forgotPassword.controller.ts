import { HttpStatus } from 'src/common/constants'
import {
    ResetPasswordRequestBodyType,
} from './types'
import { EmailRequestBody } from 'src/types/common'
import { TypedRequest } from 'src/types/request'
import { Response, NextFunction } from 'express'
import * as authService from 'src/features/auth/auth.service'
import * as forgotPasswordService from './forgotPassword.service'

export const handleForgotPassword = async (
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

        if (!user || user.emailVerified) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                message: 'Your email is not verified! Please confirm your email!',
            })
        }

        await forgotPasswordService.createResetToken(user.id, email)

        return res.status(HttpStatus.OK).json({
            message: 'Password reset email sent!',
        })
    } catch (error) {
        next(error)
    }
}

export const handleResetPassword = async (
    req: TypedRequest<ResetPasswordRequestBodyType>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.params
        const { newPassword } = req.body

        if (!token) return res.sendStatus(HttpStatus.NOT_FOUND)

        if (!newPassword) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'New password is required!',
            })
        }

        const resetToken = await forgotPasswordService.getResetToken(token as string)

        if (!resetToken) {
            return res.status(HttpStatus.NOT_FOUND).json({
                error: 'Invalid or expires token',
            })
        }

        await forgotPasswordService.resetUserPassword(resetToken.userId, newPassword)

        return res.status(HttpStatus.OK).json({
            message: 'Password reset successful!',
        })
    } catch (error) {
        next(error)
    }
}
