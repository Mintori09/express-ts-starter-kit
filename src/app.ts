import express, { type Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { xssMiddleware } from 'src/common/middleware/xssMiddleware'
import { corsConfig } from 'src/config'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import compressFilter from 'src/utils/compressFilter.util'
import { errorHandler } from 'src/common/middleware'
import path from 'node:path'
import router from 'src/common/routes'

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

app.use('/api/v1', router)

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
