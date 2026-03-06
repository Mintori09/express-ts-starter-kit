import express, { type Express } from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { xssMiddleware } from 'src/common/middleware/xssMiddleware'
import { corsConfig } from 'src/config'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import compressFilter from 'src/utils/compressFilter.util'
import { errorHandler } from 'src/common/middleware'
import { HttpStatus } from './common/constants'
import router from 'src/common/routes'

const app: Express = express()

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(xssMiddleware())
app.use(cookieParser())
app.use(cors(corsConfig))
app.use(compression({ filter: compressFilter }))

app.use('/api/v1', router)

app.all('*path', (req, res) => {
    res.status(HttpStatus.NOT_FOUND)
    if (req.accepts('html')) {
        res.json({ error: '404 Not Found' })
    } else if (req.accepts('json')) {
        res.json({ error: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

app.use(errorHandler)

export default app
