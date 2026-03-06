import { Omit } from 'utility-types'

export interface UserSignUpCredentials {
    username: string
    email: string
    password: string
    passwordConfirmed: string
}

export interface UserLoginCredentials {
    email: string
    password: string
}
