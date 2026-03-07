import { Router } from 'express'
import validate from 'src/common/middleware/validate'
import { loginSchema, signupSchema } from './auth.validation'

import * as authController from './auth.controller'
import isAuth from 'src/common/middleware/isAuth'

const authRouter = Router()

authRouter.post('/signup', validate(signupSchema), authController.handleSignup)

authRouter.post('/login', validate(loginSchema), authController.handleLogin)

authRouter.post('/logout', isAuth, authController.handleLogout)

authRouter.post('/refresh', authController.handleRefresh)

authRouter.get('/me', isAuth, authController.getMe)

export default authRouter
