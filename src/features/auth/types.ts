import { Omit } from 'utility-types'

export interface UserSignUpCredentials {
    username: string
    email: string
    password: string
    passwordConfirmed: string
}

export type UserLoginCredentials = Omit<UserSignUpCredentials, 'username'>
