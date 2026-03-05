import nodemailer, { Transporter } from 'nodemailer'
import config from './config'
// const nodemailer = require('nodemailer')

let transporter: Transporter | null = null

const createTestAccount = async () => {
    try {
        const account = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
                user: account.user,
                pass: account.pass,
            },
        })
        console.log(`Test account created: ${account.user}`)
    } catch (error) {
        console.error(`Failed to create a test account:`, error)
    }
}

if (config.node_env === 'production') {
    transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: parseInt(config.email.smtp.port),
        secure: false,
        auth: {
            user: config.email.smtp.auth.username,
            pass: config.email.smtp.auth.password,
        },
    })
} else {
    createTestAccount()
}

export default transporter
