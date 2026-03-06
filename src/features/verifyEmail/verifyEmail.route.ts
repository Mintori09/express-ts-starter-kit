import { Router } from 'express'
import * as verifyEmailController from './verifyEmail.controller'
import {
    sendVerifyEmailSchema,
    verifyEmailSchema,
} from './verifyEmail.validation'
import validate from 'src/common/middleware/validate'

const verifyEmailRouter = Router()

verifyEmailRouter.post(
    '/send-verification-email',
    validate(sendVerifyEmailSchema),
    verifyEmailController.sendVerificationEmail
)

verifyEmailRouter.post(
    '/:token',
    validate(verifyEmailSchema),
    verifyEmailController.handleVerifyEmail
)

export default verifyEmailRouter
