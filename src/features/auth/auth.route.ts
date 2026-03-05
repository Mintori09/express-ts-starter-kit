import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import { loginSchema, signupSchema } from './auth.validation'

import * as authController from './auth.controller'

const authRouter = Router()

authRouter.post('/signup', validate(signupSchema), authController.handleSignup)

authRouter.post('/login', validate(loginSchema), authController.handleSignup)

authRouter.post('/logout', authController.handleLogout)

authRouter.post('/refresh', authController.handleRefresh)

export default authRouter
