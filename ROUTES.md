# Blog API Routes Documentation

A simple class blog with session-based authentication, posts, comments and likes. The frontend is fully built — the backend uses Express 5 + Drizzle ORM (PostgreSQL), with a manual sessions table (no auth packages), Zod validation, and multer for image uploads.

## Project Structure

```
├── .env                      ← DATABASE_URL
├── drizzle.config.js
├── index.js                  ← Express app entry (wiring only)
├── seed.js                   ← demo users/posts/comments/likes
├── db/
│   ├── index.js              ← pg Pool + drizzle client
│   └── schema.js             ← all tables + relations
├── drizzle/                  ← generated migrations
├── middleware/
│   ├── checkAuth.js          ← session lookup → req.user
│   ├── validateBody.js       ← Zod validation
│   └── upload.js             ← multer image upload
├── queries/                  ← ALL database access lives here
│   ├── auth.queries.js
│   ├── post.queries.js
│   └── comment.queries.js
├── routes/                   ← thin: middleware wiring + calls queries (never touches db)
│   ├── auth.routes.js
│   ├── post.routes.js
│   └── pages.routes.js
├── validation-schemas/
│   ├── auth.js               ← hand-written Zod
│   └── posts.js              ← drizzle-zod (createInsertSchema)
├── uploads/                  ← uploaded images land here (served statically)
└── pages/                    ← static frontend (Tailwind CDN, fetch-based)
```

## Packages

```bash
npm install bcrypt cookie-parser drizzle-orm express multer pg zod
npm install -D drizzle-kit
```

---

## Database Tables

- **users** — `id, username, email (unique), password_hash, created_at`
- **sessions** — `id, session_id (unique), user_id → users, expires_at, created_at`
- **posts** — `id, user_id → users, content, image (nullable), created_at`
- **comments** — `id, post_id → posts, user_id → users, content, created_at`
- **likes** — `user_id → users, post_id → posts, created_at` (composite primary key)

---

## API Routes

### Auth Routes (`/auth`)

#### POST `/auth/register`

Register a new user. **Does not create a session** — user must log in afterwards.

**Request Body:**

```json
{
  "username": "string (min 2 chars)",
  "email": "string (valid email)",
  "password": "string (min 8, must have uppercase, lowercase, digit, special char)",
  "password_confirmation": "string (must match password)"
}
```

**Success Response (201):**

```json
{ "message": "register successful, you can now login" }
```

**Error Response (422):**

```json
{
  "errors": {
    "email": { "errors": ["email already in use"] },
    "password": { "errors": ["password must contain..."] }
  }
}
```

---

#### POST `/auth/login`

Login and receive a session cookie.

**Request Body:**

```json
{
  "email": "string (valid email)",
  "password": "string (min 8)"
}
```

**Success Response (200):**

```json
{
  "message": "login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "string",
      "username": "string"
    }
  }
}
```

Also sets an httpOnly cookie named `blog_session` containing the session id (random 32-byte hex, stored in the `sessions` table, valid for 7 days).

**Error Response (401):**

```json
{ "error": "invalid email or password" }
```

---

#### POST `/auth/logout`

Delete the session row and clear the cookie.

**Success Response (200):**

```json
{ "message": "logout successful" }
```

---

#### GET `/auth/me`

Return the current session's user. **Auth required.**

**Success Response (200):**

```json
{
  "data": {
    "user": { "id": 1, "email": "string", "username": "string" }
  }
}
```

---

### Post Routes (`/api/posts`)

All post routes require auth (session cookie).

#### GET `/api/posts`

List all posts, newest first. **No pagination.**

Each post includes the author's username, like count, comment count, and whether the current user liked it.

**Success Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "content": "string",
      "image": "string (filename) or null",
      "created_at": "ISO date string",
      "username": "string",
      "like_count": 3,
      "comment_count": 2,
      "liked_by_me": true
    }
  ]
}
```

---

#### POST `/api/posts`

Create a post. **Request must be `multipart/form-data`.**

**Form Fields:**

- `content` — string (min 1, max 5000) — required
- `image` — file (optional) — jpg, jpeg, png, webp or gif, max 5MB

**Success Response (201):**

```json
{
  "message": "post created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "content": "...",
    "image": "uuid.png or null",
    "created_at": "..."
  }
}
```

**Error Response (422):**

```json
{
  "errors": {
    "content": { "errors": ["post content cannot be empty"] },
    "image": { "errors": ["image must be smaller than 5MB"] }
  }
}
```

---

#### GET `/api/posts/:id`

Get one post with its comments.

**Success Response (200):**

```json
{
  "data": {
    "post": {
      "id": 1,
      "content": "string",
      "image": "string or null",
      "created_at": "ISO date string",
      "username": "string",
      "like_count": 3,
      "comment_count": 2,
      "liked_by_me": false
    },
    "comments": [
      {
        "id": 1,
        "content": "string",
        "created_at": "ISO date string",
        "username": "string"
      }
    ]
  }
}
```

**Error Response (404):**

```json
{ "error": "post not found" }
```

---

#### POST `/api/posts/:id/like`

Like/unlike a post (toggle).

**Success Response (200):**

```json
{
  "data": {
    "liked": true,
    "like_count": 4
  }
}
```

**Error Response (404):**

```json
{ "error": "post not found" }
```

---

#### POST `/api/posts/:id/comments`

Add a comment to a post.

**Request Body:**

```json
{
  "content": "string (min 1, max 2000)"
}
```

**Success Response (201):**

```json
{
  "message": "comment created successfully",
  "data": {
    "id": 1,
    "content": "string",
    "created_at": "ISO date string",
    "username": "string"
  }
}
```

**Error Response (404):**

```json
{ "error": "post not found" }
```

---

## Middleware

### `checkAuth`

- Read `blog_session` cookie
- Look up a non-expired row in `sessions`, join `users`
- Attach `{ id, username, email }` to `req.user`
- Return 401 `{ error: "invalid session" }` on failure

### `validateBody(schema)`

- Take a Zod schema
- Call `schema.safeParse(req.body)`
- If success → `next()`
- If error → return 422 `{ errors: z.treeifyError(result.error).properties }`

### `uploadImage(field)`

- Multer disk storage into `uploads/` with a random UUID filename
- Accepts jpg, jpeg, png, webp, gif — max 5MB
- On failure → 422 `{ errors: { image: { errors: ["..."] } } }`
