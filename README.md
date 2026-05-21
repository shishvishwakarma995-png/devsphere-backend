# ⚙️ DevSphere Backend

### REST API for DevSphere — Developer Community Platform

[![Live API](https://img.shields.io/badge/🚀_Live_API-Render-6366F1?style=for-the-badge)](https://devsphere-backend.onrender.com)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express)](https://expressjs.com)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-5-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com)

</div>

---

## 🔌 Base URL

```
Production:  https://devsphere-backend.onrender.com
Development: http://localhost:4000
```

Health check:
```bash
curl https://devsphere-backend.onrender.com
# → { "message": "DevSphere API is running 🚀" }
```

---

## 📡 Complete API Reference

### 🔐 Auth Routes — `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/register` | ❌ | `{ email, username, password }` | Create account |
| `POST` | `/login` | ❌ | `{ email, password }` | Login → returns JWT token |

**Login Response:**
```json
{
  "token": "eyJhbGc...",
  "user": { "id": "...", "email": "...", "username": "..." }
}
```

---

### 📝 Posts Routes — `/api/posts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ❌ | Get posts (query: `?sort=hot\|new\|top\|rising&tag=TypeScript`) |
| `GET` | `/:id` | ❌ | Single post with comments + vote count |
| `POST` | `/` | ✅ | Create post |
| `DELETE` | `/:id` | ✅ | Delete own post (+ cascade votes/comments/bookmarks) |
| `POST` | `/:id/vote` | ✅ | Toggle vote → `{ type: "UP"\|"DOWN" }` |
| `GET` | `/:id/comments` | ❌ | Get all comments for post |
| `POST` | `/:id/comments` | ✅ | Add comment → `{ content }` |

**Sort Algorithm (Hot):**
```
score = votes / (hoursOld + 2)^1.5
```

---

### 🏘️ Communities Routes — `/api/communities`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ❌ | List all communities with member count |
| `GET` | `/my/list` | ✅ | My joined communities |
| `GET` | `/:slug` | ❌ | Community detail + posts |
| `POST` | `/` | ✅ | Create community → `{ name, slug, description }` |
| `POST` | `/:slug/join` | ✅ | Toggle join/leave |

---

### 👤 Users Routes — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:username` | ❌ | Public profile + posts + counts |
| `GET` | `/me/profile` | ✅ | My own full profile |
| `PUT` | `/me` | ✅ | Update profile → `{ name, bio, headline, skills }` |
| `POST` | `/:username/follow` | ✅ | Toggle follow/unfollow |

---

### 🔖 Bookmarks Routes — `/api/bookmarks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✅ | Get my saved posts |
| `POST` | `/:postId` | ✅ | Toggle bookmark (save/unsave) |

---

### 🔍 Search & Discovery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/search?q=query` | ❌ | Search posts, communities, users |
| `GET` | `/api/feed/following` | ✅ | Posts from followed users |
| `GET` | `/api/trending/tags` | ❌ | Top tags last 24 hours |
| `GET` | `/api/stats` | ❌ | Platform stats (posts, communities, users) |

---

## 🗄️ Database Schema

```
User ──────────── posts (Post[])
               ── comments (Comment[])
               ── votes (Vote[])
               ── bookmarks (Bookmark[])
               ── following (Follow[])
               ── followers (Follow[])
               ── communityMemberships (CommunityMember[])

Community ─────── posts (Post[])
               ── members (CommunityMember[])

Post ──────────── votes (Vote[])     @@unique([userId, postId])
               ── comments (Comment[])
               ── bookmarks (Bookmark[])

Follow ─────────  @@unique([followerId, followingId])
CommunityMember── @@unique([userId, communityId])
Bookmark ──────── @@unique([userId, postId])
Vote ───────────── @@unique([userId, postId])
```

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime |
| **Express** | 4 | HTTP framework |
| **TypeScript** | 5 | Type safety |
| **Prisma ORM** | 5 | Type-safe database queries |
| **PostgreSQL** | via Supabase | Database |
| **jsonwebtoken** | latest | JWT auth tokens |
| **bcryptjs** | latest | Password hashing (salt rounds: 10) |
| **cors** | latest | Cross-origin resource sharing |
| **dotenv** | latest | Environment variables |

---

## 📁 Folder Structure

```
devsphere-backend/
│
├── src/
│   ├── index.ts               # Express server entry point
│   │                          # + search, feed, trending, stats routes
│   ├── routes/
│   │   ├── auth.ts            # Register + Login
│   │   ├── posts.ts           # Posts CRUD + vote + comments
│   │   ├── communities.ts     # Communities CRUD + join/leave
│   │   ├── users.ts           # Profiles + follow
│   │   └── bookmarks.ts       # Save/unsave posts
│   ├── middleware/
│   │   └── auth.ts            # requireAuth — JWT verification
│   └── lib/
│       └── prisma.ts          # PrismaClient singleton
│
├── prisma/
│   ├── schema.prisma          # 8 database models
│   └── seed.ts                # Test data script
│
├── tsconfig.json
└── package.json
```

---

## 🔐 Authentication

All `✅ Auth required` routes need this header:

```
Authorization: Bearer <JWT_TOKEN>
```

Get the token from `POST /api/auth/login`. Token expires in **7 days**.

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Supabase account (free) OR local PostgreSQL

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/devsphere-backend.git
cd devsphere-backend

# Install dependencies
npm install
```

### Environment Variables

Create `.env`:

```env
# Supabase connection (from Supabase → Settings → Database)
DATABASE_URL="postgresql://postgres:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres"

# Auth
JWT_SECRET="your-very-long-random-secret-key-here"

# CORS
FRONTEND_URL="http://localhost:3000"

# Server
PORT=4000
```

### Run

```bash
# Push schema to database
npx prisma db push

# Seed test data (creates user, communities, posts)
npm run seed

# Start development server
npm run dev
```

Test: Visit [http://localhost:4000](http://localhost:4000)

---

## 🌐 Deployment (Render)

### Step 1 — Prepare for production

Make sure `package.json` has:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "nodemon --exec ts-node src/index.ts",
  "seed": "ts-node prisma/seed.ts"
}
```

### Step 2 — Push to GitHub

```bash
git add .
git commit -m "feat: complete DevSphere backend"
git push origin main
```

### Step 3 — Deploy on Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect `devsphere-backend` GitHub repo
3. Configure:
   | Setting | Value |
   |---------|-------|
   | **Build Command** | `npm install && npm run build` |
   | **Start Command** | `node dist/index.js` |
   | **Plan** | Free |
4. Add Environment Variables (same as `.env` above, update `FRONTEND_URL` to Vercel URL)
5. Click **Create Web Service**

---

## 🔗 Related

- **[Frontend Repository →](https://github.com/YOUR_USERNAME/devsphere-frontend)**
- **[Live Demo →](https://devsphere-frontend-six.vercel.app/)**

---

## 👤 Author

**Shishanki Vishwakarma**

[![GitHub](https://img.shields.io/badge/GitHub-shishvishwakarma995--png-181717?style=flat&logo=github)](https://github.com/shishvishwakarma995-png)

---
