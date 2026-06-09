# Pixora — Event & Media Management Platform

A full-stack platform for managing event photography and videography. Built for college clubs and organizations to handle media uploads, face-based photo discovery, real-time notifications, and role-based access control.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Roles & Permissions](#roles--permissions)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Deployment (Vercel Free Tier)](#deployment-vercel-free-tier)
- [API Routes](#api-routes)
- [Architecture](#architecture)

---

## Features

### Core
- **Event management** — Create public/private events with categories, cover images, and locations
- **Media upload** — Drag-and-drop photos and videos; duplicate detection before uploading
- **Role-based visibility** — Photographer uploads are visible to all; member uploads are member-only
- **AI auto-tagging** — Optional Cloudinary-powered tags on upload (off by default on free tier)
- **Face search** — Upload a selfie, find all photos you appear in using pixel-level NCC comparison
- **Albums** — Organize event media into named albums
- **Watermarked downloads** — Track and optionally watermark downloaded media

### Social
- Like, comment, and favorite any photo or video
- Tag other users in media
- Follow / unfollow other users
- Real-time notifications (Pusher WebSocket) for likes, comments, tags, follows

### Auth
- Email/password registration with OTP email verification (Gmail SMTP)
- JWT sessions via NextAuth.js v5
- Profile page with avatar, bio, and reference selfie for face search

### Admin
- ADMIN and CLUB_ADMIN dashboards
- Per-event admin assignment (`EventAdmin` table)
- Per-event member management (`EventMember` table)
- Manage users, promote roles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma v5 |
| Database | PostgreSQL via Supabase (free tier) |
| Auth | NextAuth.js v5 (JWT, credentials provider) |
| Media storage | Cloudinary (free tier, 25 GB) |
| Real-time | Pusher Channels (free tier, 100 simultaneous) |
| Email | Gmail SMTP (App Password) |
| Image processing | sharp (bundled with Next.js) |
| Deployment | Vercel (free tier) |

---

## Roles & Permissions

### Global Roles

| Role | Description |
|---|---|
| `ADMIN` | Platform superadmin — full access everywhere |
| `CLUB_ADMIN` | Can create events, manage event membership for their events |
| `PHOTOGRAPHER` | Can upload to public events and private events they are EventMember of |
| `VIEWER` | Default role — can browse public events; uploads only as EventMember |

### Per-Event Tables

- **`EventAdmin`** — marks a user as admin for a specific event (granted by ADMIN/CLUB_ADMIN)
- **`EventMember`** — grants private event access + upload permission to any user

### Media Visibility Matrix

| Upload by | `memberOnly` field | Who can see |
|---|---|---|
| ADMIN / CLUB_ADMIN | `false` | Everyone with event access |
| PHOTOGRAPHER | `false` | Everyone with event access |
| EventMember (VIEWER) | `true` | Only admins + EventMembers |

### Event Access

| User | Public event | Private event |
|---|---|---|
| ADMIN / CLUB_ADMIN | Full access | Full access |
| PHOTOGRAPHER | Can view + upload | Can view + upload if EventMember |
| VIEWER | Can view | Only if EventMember |
| Unauthenticated | Can view | Redirected |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, register, verify-email pages
│   ├── (main)/          # Authenticated layout
│   │   ├── dashboard/   # Role-aware media dashboard
│   │   ├── events/      # Event list + detail pages
│   │   ├── upload/      # Drag-and-drop upload page
│   │   ├── ai/          # Face search page
│   │   ├── profile/     # User profile + selfie management
│   │   └── admin/       # Admin panels
│   └── api/
│       ├── auth/        # NextAuth.js handler
│       ├── events/      # CRUD for events, members, admins
│       ├── media/       # Upload, list, download, duplicate-check
│       ├── ai/          # Face search endpoint
│       ├── users/       # User management
│       └── notifications/ # Read/mark notifications
├── components/
│   ├── ui/              # Shared UI primitives (Button, Card, etc.)
│   ├── media/           # MediaCard, MediaGrid, LightboxModal
│   ├── events/          # EventCard, EventForm
│   └── notifications/   # NotificationBell (real-time Pusher)
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma singleton
│   ├── cloudinary.ts    # Upload, thumbnail, face crop helpers
│   ├── pusher.ts        # Pusher server + channel helpers
│   ├── ai.ts            # AI tag generation
│   └── utils.ts         # cn(), formatBytes, constants
├── types/               # Shared TypeScript types
└── proxy.ts             # Pusher auth proxy

prisma/
├── schema.prisma        # Database models
└── seed.ts              # Optional seed data

schema.dbml              # DB schema for dbdiagram.io
ARCHITECTURE.md          # System + ER diagrams (Mermaid)
```

---

## Database Schema

14 tables. Full DBML source: [schema.dbml](schema.dbml)
ER and system diagrams: [ARCHITECTURE.md](ARCHITECTURE.md)
Visualize interactively at [dbdiagram.io](https://dbdiagram.io) — paste `schema.dbml`.

Key tables:

| Table | Purpose |
|---|---|
| `users` | Accounts, roles, selfie URL, OTP fields |
| `events` | Event metadata, public/private flag |
| `event_admins` | Per-event admin assignments |
| `event_members` | Per-event membership grants |
| `media` | Photos and videos with `memberOnly` flag |
| `albums` | Media grouping within an event |
| `likes / comments / favorites / media_tags` | Social interactions |
| `notifications` | Real-time notification records |
| `face_matches` | AI face search results (NCC score) |
| `follows` | User follow graph |
| `downloads` | Download audit log |

---

## Environment Variables

Create `.env` in the project root:

```env
# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-at-least-32-chars"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Pusher
PUSHER_APP_ID="your_app_id"
PUSHER_KEY="your_key"
PUSHER_SECRET="your_secret"
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY="your_key"
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"

# Gmail SMTP (App Password, not account password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="Pixora <your@gmail.com>"
```

### Where to get each service

| Service | Free tier | Link |
|---|---|---|
| Supabase | 500 MB database, 2 projects | supabase.com |
| Cloudinary | 25 GB storage, 25 GB bandwidth/month | cloudinary.com |
| Pusher Channels | 100 connections, 200k messages/day | pusher.com |
| Gmail SMTP | Free with Google account | myaccount.google.com → Security → App Passwords |

---

## Local Setup

```bash
git clone <repo-url>
cd pixora
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time setup

1. Register an account at `/register`
2. Check your email for the OTP and verify
3. In the database (Supabase dashboard or `prisma studio`), set your user's `role` to `ADMIN`
4. Log back in — you now have full admin access

---

## Deployment (Vercel Free Tier)

### Vercel limits that matter

| Limit | Value | How Pixora handles it |
|---|---|---|
| Function timeout | 10 seconds | `export const maxDuration = 10` on upload + face-search routes |
| Function memory | 1024 MB | sharp NCC runs on 24×24px crops — negligible memory |
| Bandwidth | 100 GB/month | All media served from Cloudinary CDN, not Vercel |

### Steps

```bash
npm i -g vercel
vercel
```

Set environment variables in the Vercel dashboard under Project → Settings → Environment Variables.

After deploying:
1. Set `NEXTAUTH_URL` to your production URL (e.g. `https://pixora.vercel.app`)
2. Add the Vercel domain to Cloudinary's allowed origins
3. Add the Vercel domain to Pusher's allowed origins

### Performance notes

- **AI tagging is off by default** (`aiTag` toggle defaults to false) — saves ~2s per upload
- **Face search scans at most 12 recent photos** (`MAX_SCAN = 12`) — keeps within 10s timeout
- **Thumbnails** are 800px-wide scaled (no crop distortion), served from Cloudinary CDN
- **Original files** stored at full quality — no compression applied on upload

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user, send OTP |
| POST | `/api/auth/verify-otp` | Verify OTP, activate account |
| POST | `/api/auth/[...nextauth]` | NextAuth sign-in/sign-out |

### Events
| Method | Route | Description |
|---|---|---|
| GET | `/api/events` | List events (filtered by role) |
| POST | `/api/events` | Create event (ADMIN/CLUB_ADMIN) |
| GET | `/api/events/[id]` | Get event details |
| PATCH | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Delete event |
| GET | `/api/events/[id]/members` | List EventMembers |
| POST | `/api/events/[id]/members` | Add EventMember |
| DELETE | `/api/events/[id]/members/[userId]` | Remove EventMember |
| POST | `/api/events/[id]/admins` | Add EventAdmin |

### Media
| Method | Route | Description |
|---|---|---|
| GET | `/api/media` | List media (role-aware, memberOnly filter) |
| POST | `/api/media/upload` | Upload photo/video to Cloudinary + DB |
| GET | `/api/media/[id]` | Get single media item |
| DELETE | `/api/media/[id]` | Delete media |
| POST | `/api/media/check-duplicate` | Check if file is duplicate before uploading |
| POST | `/api/media/[id]/like` | Toggle like |
| POST | `/api/media/[id]/favorite` | Toggle favorite |
| POST | `/api/media/[id]/comment` | Add comment |
| GET | `/api/media/[id]/download` | Download (tracked, optionally watermarked) |

### AI
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/face-search` | Find photos containing the user's face (NCC pixel comparison via sharp) |
| POST | `/api/ai/reference-image` | Save a selfie as the user's face reference |

### Users
| Method | Route | Description |
|---|---|---|
| GET | `/api/users/[id]` | Get user profile |
| PATCH | `/api/users/[id]` | Update profile |
| POST | `/api/users/[id]/follow` | Follow/unfollow |

### Notifications
| Method | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Get unread notifications |
| PATCH | `/api/notifications/[id]` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

### Real-time (Pusher)
| Method | Route | Description |
|---|---|---|
| POST | `/api/pusher/auth` | Authenticate private Pusher channels |

---

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for:
- **System architecture diagram** — Browser → Next.js API → Prisma → PostgreSQL + Cloudinary/Pusher/SMTP
- **Entity-relationship diagram** — All 14 tables with relationships

### Face Search Implementation

Standard embedding-based face recognition requires a GPU inference server (HuggingFace, AWS Rekognition) — incompatible with Vercel's free tier 10s timeout.

Pixora uses a lightweight alternative:

1. When the user uploads a selfie, it is stored as `referenceImageUrl` on their profile via Cloudinary
2. When face search runs, the Cloudinary Vision API returns face bounding boxes for each photo
3. Each face crop is downloaded and resized to 24×24 greyscale pixels using `sharp`
4. A **Normalized Cross-Correlation (NCC)** score is computed between the query selfie and each face crop
5. Photos where any face scores above threshold (0.25) are returned as matches

NCC is lighting-invariant because it normalizes by mean and variance. It works well for controlled-lighting club event photos. False-positive rate is low because different faces have fundamentally different pixel distributions at this scale.

---

## License

MIT
