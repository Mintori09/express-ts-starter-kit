import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import * as forgotPasswordController from './forgotPassword.controller'
import { forgotPasswordSchema } from './password.validation'

const passwordRouter = Router()

passwordRouter.post(
    '/forgot-password',
    validate(forgotPasswordSchema),
    forgotPasswordController.handleForgotPassword
)

passwordRouter.post(
    '/reset-password/:token',
    validate(forgotPasswordSchema),
    forgotPasswordController.handleResetPassword
)

export default passwordRouter
