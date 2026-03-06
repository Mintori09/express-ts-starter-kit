### Auth Feature

#### Signup

- **URL:** `/api/v1/auth/signup`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "username": "tester",
        "email": "tester@example.com",
        "password": "Password123!",
        "passwordConfirmed": "Password123!"
    }
    ```

#### Login

- **URL:** `/api/v1/auth/login`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "email": "tester@example.com",
        "password": "Password123!"
    }
    ```

#### Logout

- **URL:** `/api/v1/auth/logout`
- **Method:** `POST`
- **Cookies:** `refresh_token=<token>`

#### Refresh

- **URL:** `/api/v1/auth/refresh`
- **Method:** `POST`
- **Cookies:** `refresh_token=<token>`

### Forgot Password Feature

#### Forgot Password

- **URL:** `/api/v1/password/forgot-password`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "email": "tester@example.com"
    }
    ```

#### Reset Password

- **URL:** `/api/v1/password/reset-password/:token`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "newPassword": "NewPassword123!"
    }
    ```

### Verify Email Feature

#### Send Verification Email

- **URL:** `/api/v1/verify-email/send-verification-email`
- **Method:** `POST`
- **Body:**
    ```json
    {
        "email": "tester@example.com"
    }
    ```

#### Verify Email

- **URL:** `/api/v1/verify-email/verify-email/:token`
- **Method:** `POST`
- **Params:** `token`
