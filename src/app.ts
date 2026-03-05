import express, { Application, type Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { xssMiddleware } from './common/middleware/xssMiddleware'
import { config, corsConfig } from './config'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import compressFilter from './utils/compressFilter.util'
import { authLimiter, errorHandler } from './common/middleware'
import { authRouter } from './features/auth'
import { passwordRouter } from './features/forgotPassword'
import { verifyEmailRouter } from './features/verifyEmail'
import path from 'node:path'

const app: Express = express()

app.use(
    helmet.frameguard({
        action: 'deny',
    })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(xssMiddleware())
app.use(cookieParser())
app.use(cors(corsConfig))
app.use(compression({ filter: compressFilter }))
app.use(express.json())

if (config.node_env === 'production') {
    app.use('api/v1/auth', authLimiter)
}

app.use('/api/v1/auth', authRouter)
app.use('/api/v1', passwordRouter)
app.use('/api/v1', verifyEmailRouter)

app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ error: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

export default app
