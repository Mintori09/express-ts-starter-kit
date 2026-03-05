import { NextFunction, Request, Response } from 'express'
import { DeepPartial, Omit } from 'utility-types'
import { IFilterXSSOptions } from 'xss'
import validate from 'src/common/middleware/validate'

export type RequestValidationSchema = Parameters<typeof validate>[0]

export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> &
        Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

export type TypedRequest<
    ReqBody = Record<string, unknown>,
    QueryString = Record<string, unknown>,
> = Request<
    Record<string, unknown>,
    Record<string, unknown>,
    DeepPartial<ReqBody>,
    DeepPartial<QueryString>
>

export type ExpressMiddlewares<
    ReqBody = Record<string, unknown>,
    Res = Record<string, unknown>,
    QueryString = Record<string, unknown>,
> = (
    req: TypedRequest<ReqBody, QueryString>,
    res: Response<Res>,
    next: NextFunction
) => Promise<void> | void

export interface UserSignUpCredentials {
    username: string
    email: string
    password: string
    passwordConfirmed: string
}

export type UserLoginCredentials = Omit<UserSignUpCredentials, 'username'>

export interface EmailRequestBody {
    email: string
}

export interface ResetPasswordRequestBodyType {
    newPassword: string
}

export type Sanitized<T> = T extends (...args: unknown[]) => unknown
    ? T
    : T extends object
      ? {
            readonly [K in keyof T]: Sanitized<T[K]>
        }
      : T

export type SanitizeOptions = IFilterXSSOptions & {
    whiteList?: IFilterXSSOptions['whiteList']
}
