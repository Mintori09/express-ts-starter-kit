import jwt from 'jsonwebtoken'
import { config } from 'src/config'

export const createAccessToken = (userId: number | string): string => {
    return jwt.sign({ userId }, config.jwt.access_token.secret, {
        expiresIn: config.jwt.access_token.expire as any,
    })
}

export const createRefreshToken = (userId: number | string): string => {
    return jwt.sign({ userId }, config.jwt.refresh_token.secret, {
        expiresIn: config.jwt.refresh_token.expire as any,
    })
}
