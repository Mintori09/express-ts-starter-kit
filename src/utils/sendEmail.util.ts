import { logger } from 'src/common/middleware'
import { transporter, config } from 'src/config'

export const sendResetEmail = (email: string, token: string) => {
    const resetLink = `${config.server.url}/api/v1/reset-password/${token}`
    const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Password reset',
        html: `
      <p>Please reset your password by clicking the button below:</p>
      <form action="${resetLink}" method="POST">
        <button type="submit">Reset Password</button>
      </form>
    `,
    }
    console.log(resetLink)
    transporter?.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        } else {
            logger.info('Reset password email sent: ' + info.response)
        }
    })
}

export const sendVerifyEmail = (email: string | undefined, token: string) => {
    const verifyLink = `${config.server.url}/api/v1/verify-email/${token}`
    const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Email verification',
        html: `
      <p>Please verify your email by clicking the button below:</p>
      <form action="${verifyLink}" method="POST">
        <button type="submit">Verify Email</button>
      </form>
    `,
    }
    console.log(verifyLink)
    transporter?.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error(error)
        } else {
            logger.info('Verify email sent: ' + info.response)
        }
    })
}
