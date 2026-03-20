# 🔐 Authentication Backend

A secure, production-ready authentication system built with **Node.js**, **TypeScript**, **Prisma**, and **PostgreSQL**. Implements dual-token auth, session management, OTP email verification, and refresh token rotation.

---

## 📁 Folder Structure

```
src/
├── controller/
│   └── authController.ts     # req/res handling — login, register, logout, getMe
├── routes/
│   └── authRoutes.ts         # Express route definitions
├── services/
│   └── emailService.ts       # Nodemailer + Gmail OAuth2 email sending
├── utils/
│   ├── types.ts              # Zod schemas for input validation
│   └── otp.ts                # OTP generator + HTML email template
├── generated/
│   └── prisma/               # Auto-generated Prisma client
├── db.ts                     # Prisma client singleton
└── server.ts                 # Express app entry point
```

---

## 🔑 Core Concepts

### Why Two Tokens? (AccessToken + RefreshToken)

Using a single token creates a dilemma:

| Single Token Approach | Problem |
|---|---|
| Never expires | If stolen → attacker has permanent access ❌ |
| Expires in 15 min | User must login every 15 minutes ❌ |

**Solution — 2 Token System:**

```
AccessToken  (15 min)  →  sent in every API request header
RefreshToken (7 days)  →  only used to generate a new AccessToken
```

---

### Token Storage

| Token | Where Stored | Why |
|---|---|---|
| `accessToken` | JS memory (frontend) | XSS-safe; lost on page refresh by design |
| `refreshToken` | HttpOnly Cookie | JS cannot access it — XSS safe |
| `refreshTokenHash` | Database | Plain token never persisted — DB breach safe |

---

## 🔄 Full Auth Flow

### 1. Register

```
POST /auth/register
  → Validate input (Zod)
  → Check if email already exists
  → Hash password (bcrypt, salt rounds: 5)
  → Create user (verified: false)
  → Generate 6-digit OTP
  → Hash OTP with SHA-256 → save to DB
  → Send OTP via email (HTML template)
  → Return user info
```

### 2. Login

```
POST /auth/login
  → Validate input (Zod)
  → Find user by email
  → Compare password (bcrypt.compare)
  → Sign refreshToken (JWT, 7d) — contains { id }
  → Hash refreshToken (SHA-256) → save to DB as session
  → Sign accessToken (JWT, 15m) — contains { id, sessionId }
  → Set refreshToken in HttpOnly cookie
  → Return accessToken + user info
```

### 3. GetMe (Protected Route)

```
GET /auth/me
  Authorization: Bearer <accessToken>

  → Extract token from header (split " ")[1]
  → Verify JWT → decode { id, sessionId }
  → Find session by sessionId WHERE revoked = false
  → Session revoked? → 401
  → Fetch user by id
  → Return user info
```

### 4. Refresh Token

```
POST /auth/refresh
  (refreshToken sent automatically via cookie)

  → Extract refreshToken from cookie
  → Verify JWT → decode { id }
  → Hash token (SHA-256) → find session in DB
  → Session not found or revoked? → 401
  → Generate new accessToken (15m)
  → Generate new refreshToken (7d)         ← Rotation
  → Hash new refreshToken → update DB      ← Old token now invalid
  → Set new refreshToken in cookie
  → Return new accessToken
```

### 5. Logout

```
POST /auth/logout
  → Extract refreshToken from cookie
  → Hash it → find session in DB
  → Set session.revoked = true             ← Backend logout
  → Clear cookie                           ← Frontend logout
```

### 6. Logout All Devices

```
POST /auth/logout-all
  → Extract refreshToken from cookie
  → Verify JWT → decode { id }
  → updateMany sessions WHERE userId = id → revoked: true
  → Clear cookie
```

---

## 🛡️ Security Decisions

### Why Hash the RefreshToken Before Storing?

```
Scenario: Database gets leaked

Without hashing:
  Attacker has valid refreshTokens → can impersonate any user ❌

With SHA-256 hash:
  Attacker has only hashes → cannot reverse to original token ✅
  Same concept as password hashing
```

**Why SHA-256 (not bcrypt) for tokens?**
- RefreshTokens are already long random strings (JWT) — brute force is impossible
- bcrypt is intentionally slow → unnecessary overhead for tokens
- SHA-256 is fast and deterministic — same input always gives same hash (needed for lookup)

### Why Store SessionId Inside AccessToken?

```
Without sessionId in JWT:
  User logs out → session.revoked = true
  Attacker uses old accessToken (still valid for 14 min)
  Server has no way to check — 401 never triggers ❌

With sessionId in JWT:
  Every protected route checks session.revoked
  Logout immediately invalidates accessToken too ✅
```

### Refresh Token Rotation

Every time `/refresh` is called:
- A **new** refreshToken is generated and set in cookie
- A **new** hash is saved in DB (old hash deleted)
- Old refreshToken is now invalid

```
If attacker steals refreshToken_1:
  User refreshes → hash updated to hash_2 in DB
  Attacker uses refreshToken_1 → hash_1 not in DB → 401 ✅
```

---

## 📧 Email Service (Gmail OAuth2)

Uses **Nodemailer** with **Gmail OAuth2** — more secure than App Passwords.

### Setup

```env
GOOGLE_USER=your@gmail.com
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_oauth_refresh_token
```

### How It Works

```
nodemailer.createTransport({ OAuth2 credentials })
    ↓
transporter.sendMail({ to, subject, text, html })
    ↓
Gmail sends email on your behalf
```

### OTP Email

- 6-digit OTP generated with `Math.floor(100000 + Math.random() * 900000)`
- Hashed with SHA-256 before saving to DB — plain OTP never persisted
- Styled HTML email template sent to user
- Valid for **10 minutes**

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id        String    @id @default(uuid())
  username  String
  email     String    @unique
  password  String    # bcrypt hash
  verified  Boolean   @default(false)
  otps      Otp[]
  sessions  Session[]
}

model Session {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  refreshTokenHash String   # SHA-256 hash — plain token never stored
  ip               String
  userAgent        String
  revoked          Boolean  @default(false)
  createdAt        DateTime @default(now())
}

model Otp {
  id        String   @id @default(uuid())
  otpHash   String   # SHA-256 hash
  email     String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🧹 Session Cleanup (Cron Job)

Sessions accumulate over time — revoked and expired sessions must be cleaned:

```typescript
// Runs every night at 2 AM
cron.schedule("0 2 * * *", async () => {
  await prismaClient.session.deleteMany({
    where: {
      OR: [
        { revoked: true },
        { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    }
  });
});
```

---

## ⚙️ Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/auth_db
JWT_SECRET=your_super_secret_key

GOOGLE_USER=your@gmail.com
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx
```

---

## 🚀 Getting Started

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpx prisma generate

# Run migrations
pnpx prisma migrate dev

# Start dev server
pnpm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, get tokens |
| GET | `/auth/me` | Bearer Token | Get current user |
| POST | `/auth/refresh` | Cookie | Get new access token |
| POST | `/auth/logout` | Cookie | Logout current device |
| POST | `/auth/logout-all` | Cookie | Logout all devices |
| POST | `/auth/verify-email` | No | Verify OTP |
