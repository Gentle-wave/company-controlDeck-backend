# Company ControlDeck Backend - Full API Documentation (Postman Style)

## PUBLISHED POSTMAN DOCUMENTATION

## **[OPEN THE PUBLISHED POSTMAN DOCUMENTATION](https://documenter.getpostman.com/view/29809802/2sBXiesuam)**

## 1. Overview

This backend is built with NestJS, Prisma, PostgreSQL, and JWT authentication.
It supports:

- Auth (email/password and Firebase login)
- Role-based access control (`USER_A`, `USER_B`)
- Company input submission and retrieval
- Image upload and image retrieval

## 2. Base URL

Use one of these depending on your environment:

- Local: `http://localhost:4000`
- Railway/Production: `https://<your-railway-domain>`

## 3. Authentication Model

Auth is JWT-based and supports two request styles:

- Cookie auth (primary): cookie name defaults to `takehome_auth`
- Bearer auth (fallback): `Authorization: Bearer <token>`

The API sets the cookie automatically on login/register endpoints.

## 4. Global Behavior

### Validation

- Global `ValidationPipe` is enabled with:
- `whitelist: true`
- `forbidNonWhitelisted: true`
- `transform: true`

### Rate Limit

- Global throttling: `30` requests per `60` seconds per IP

### Error Shape

Most errors follow this JSON shape:

```json
{
  "statusCode": 400,
  "timestamp": "2026-03-12T12:00:00.000Z",
  "path": "/auth/login",
  "method": "POST",
  "message": "Invalid credentials"
}
```

## 5. Postman Quick Setup

Create a Postman environment with these variables:

- `baseUrl` -> `http://localhost:4000`
- `authToken` -> (leave empty initially)
- `cookieName` -> `takehome_auth`
- `ownerId` -> (set from a `USER_A` id)
- `uploadId` -> (set after upload)

Optional test script after login/register to auto-save token:

```javascript
const data = pm.response.json();
if (data.token) {
  pm.environment.set('authToken', data.token);
}
if (data.id) {
  pm.environment.set('currentUserId', data.id);
}
```

When calling protected endpoints, you can use either:

- Postman Authorization tab: Bearer Token `{{authToken}}`
- Header manually: `Authorization: Bearer {{authToken}}`

## 6. Endpoints

---

## 6.1 Auth

### POST `/auth/register`

Create a new user and return JWT.

- Auth: None
- Content-Type: `application/json`

Request body:

```json
{
  "email": "user_a@example.com",
  "password": "Password123!",
  "role": "USER_A"
}
```

Validation:

- `email` must be valid email
- `password` minimum length: 8
- `role` must be one of: `USER_A`, `USER_B`

Success response (201):

```json
{
  "token": "<jwt>",
  "id": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7",
  "email": "user_a@example.com",
  "role": "USER_A"
}
```

Common errors:

- 400 validation error
- 409 duplicate email (Prisma unique constraint)

### POST `/auth/login`

Login with email/password and return JWT.

- Auth: None
- Content-Type: `application/json`

Request body:

```json
{
  "email": "user_a@example.com",
  "password": "Password123!"
}
```

Success response (200):

```json
{
  "token": "<jwt>",
  "id": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7",
  "email": "user_a@example.com",
  "role": "USER_A"
}
```

Common errors:

- 401 `Invalid credentials`

### POST `/auth/firebase/login`

Login using Firebase ID token. If user does not exist, account can be provisioned when `role` is provided.

- Auth: None
- Content-Type: `application/json`

Request body (existing user):

```json
{
  "idToken": "<firebase-id-token>"
}
```

Request body (first-time user provisioning):

```json
{
  "idToken": "<firebase-id-token>",
  "role": "USER_B"
}
```

Validation:

- `idToken` minimum length: 10
- `role` optional, but required for first login when email does not exist

Success response (200):

```json
{
  "token": "<jwt>",
  "id": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7",
  "email": "firebase-user@example.com",
  "role": "USER_B"
}
```

Common errors:

- 400 `role is required on first Firebase login`
- 401 `Invalid Firebase ID token`
- 503 `Firebase auth is not configured on the server`

### POST `/auth/logout`

Clears auth cookie.

- Auth: Optional

Success response (200):

```json
{
  "success": true
}
```

---

## 6.2 Users

### GET `/users/me`

Get current authenticated user payload from JWT.

- Auth: Required (`USER_A` or `USER_B`)

Success response (200):

```json
{
  "userId": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7",
  "role": "USER_A"
}
```

Common errors:

- 401 unauthorized

---

## 6.3 Company Input

### POST `/company-input`

Create company input record for the authenticated owner.

- Auth: Required
- Roles: `USER_A` only
- Content-Type: `application/json`

Request body:

```json
{
  "companyName": "Acme Corp",
  "numberOfUsers": 200,
  "numberOfProducts": 50
}
```

Validation:

- `companyName`: string, max length 255
- `numberOfUsers`: positive integer
- `numberOfProducts`: integer, minimum 0

Business rule:

- `percentage` is computed as `(numberOfProducts / numberOfUsers) * 100`

Success response (201):

```json
{
  "id": "76f7f226-d0f5-4e34-aa10-7f5be66ca6bc",
  "companyName": "Acme Corp",
  "numberOfUsers": 200,
  "numberOfProducts": 50,
  "percentage": 25,
  "createdAt": "2026-03-12T12:00:00.000Z",
  "ownerId": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7"
}
```

Common errors:

- 401 unauthorized
- 403 forbidden (wrong role)
- 400 validation error

### GET `/company-input/latest/:ownerId`

Get latest company input for an owner.

- Auth: Required
- Roles: `USER_B` only
- Params:
- `ownerId` (UUID)

Success response (200):

```json
{
  "id": "76f7f226-d0f5-4e34-aa10-7f5be66ca6bc",
  "companyName": "Acme Corp",
  "numberOfUsers": 200,
  "numberOfProducts": 50,
  "percentage": 25,
  "createdAt": "2026-03-12T12:00:00.000Z",
  "ownerId": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7"
}
```

If no record exists, response is `null`.

Common errors:

- 400 invalid UUID
- 401 unauthorized
- 403 forbidden

---

## 6.4 Uploads

### POST `/uploads`

Upload image and store metadata.

- Auth: Required
- Roles: `USER_B` only
- Content-Type: `multipart/form-data`

Form-data fields:

- `file` (file, required)
- `ownerId` (text UUID, required)

Constraints:

- MIME must start with `image/`
- Max file size: 5 MB

Success response (201):

```json
{
  "id": "1c8f228d-63c9-45fc-b4d4-fb907c3879c8",
  "filename": "1710243908102-123456789-photo.jpg",
  "mimetype": "image/jpeg",
  "size": 102400,
  "storagePath": "/app/uploads/1710243908102-123456789-photo.jpg",
  "ownerId": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7",
  "uploaderId": "4a7c7e9f-6fc5-4dbd-a293-ec5de804ce49",
  "createdAt": "2026-03-12T12:00:00.000Z"
}
```

Common errors:

- 400 invalid ownerId
- 400 non-image upload (`Only image uploads are allowed`)
- 413 payload too large (file > 5MB)
- 401 unauthorized
- 403 forbidden

### GET `/uploads/latest/:ownerId`

Get latest uploaded image metadata for an owner.

- Auth: Required
- Roles: `USER_B` only
- Params:
- `ownerId` (UUID)

Success response (200):

```json
{
  "id": "1c8f228d-63c9-45fc-b4d4-fb907c3879c8",
  "filename": "1710243908102-123456789-photo.jpg",
  "mimetype": "image/jpeg",
  "size": 102400,
  "storagePath": "/app/uploads/1710243908102-123456789-photo.jpg",
  "ownerId": "f7f6a508-92dd-4ad4-9b6f-2ad7e28940b7",
  "uploaderId": "4a7c7e9f-6fc5-4dbd-a293-ec5de804ce49",
  "createdAt": "2026-03-12T12:00:00.000Z",
  "url": "http://localhost:4000/uploads/1c8f228d-63c9-45fc-b4d4-fb907c3879c8",
  "path": "/uploads/1c8f228d-63c9-45fc-b4d4-fb907c3879c8"
}
```

If no record exists, response is `null`.

### GET `/uploads/:identifier`

Serve image binary by upload id or filename.

- Auth: Not required (public)
- Params:
- `identifier` -> upload UUID or stored filename

Success response (200):

- Raw image stream with content type based on file

Common errors:

- 404 `Image not found`
- 404 `Image file missing on disk`

---

## 7. Roles and Access Matrix

| Endpoint | USER_A | USER_B | Public |
|---|---|---|---|
| POST /auth/register | Yes | Yes | Yes |
| POST /auth/login | Yes | Yes | Yes |
| POST /auth/firebase/login | Yes | Yes | Yes |
| POST /auth/logout | Yes | Yes | Yes |
| GET /users/me | Yes | Yes | No |
| POST /company-input | Yes | No | No |
| GET /company-input/latest/:ownerId | No | Yes | No |
| POST /uploads | No | Yes | No |
| GET /uploads/latest/:ownerId | No | Yes | No |
| GET /uploads/:identifier | Yes | Yes | Yes |

## 8. Example Environment File

Use this as a template (`.env.example`) for local or cloud deploys.

```env
DATABASE_URL="postgresql://db_user:db_password@localhost:5432/takehome?schema=public"

JWT_SECRET="replace-with-long-random-secret"
JWT_EXPIRATION="3600s"

COOKIE_NAME="takehome_auth"
COOKIE_SAME_SITE="lax"
COOKIE_SECURE="false"
COOKIE_MAX_AGE_MS="3600000"

APP_PORT=4000
NODE_ENV="development"
TRUST_PROXY="false"

# Firebase Admin (required only for /auth/firebase/login)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n<your-private-key>\n-----END PRIVATE KEY-----\n"
```

Notes:

- In production behind Railway/Render proxy, set `TRUST_PROXY="true"`.
- If frontend and backend are on different domains, prefer:
- `COOKIE_SAME_SITE="none"`
- `COOKIE_SECURE="true"`

## 9. Local Run and Seed (for Postman Testing)

```bash
npm ci
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev
```

Seeded test users:

- USER_A: `user_a@example.com` / `Password123!`
- USER_B: `user_b@example.com` / `Password456!`
