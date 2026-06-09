# Pixora : Event & Media Management Platform

A full-stack platform for college clubs and organizations to manage event photography and videography. Covers the full lifecycle: create an event, upload media, organize into albums, discover photos using AI face search, and share with role-based visibility controls.

**Live Demo:** [https://cig-op-webd-final.vercel.app](https://cig-op-webd-final.vercel.app)  
**Database Schema:** [https://dbdiagram.io/d/6a26cbf025fc5bf036b9f762](https://dbdiagram.io/d/6a26cbf025fc5bf036b9f762)

---

## Table of Contents
- [Demo Accounts](#demo-accounts)
- [Features](#features)
- [How It Works](#how-it-works)
- [Role Guide](#role-guide)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [API Routes](#api-routes)

---

## Demo Accounts

All accounts use password: **`password123`**

| Role | Email | Name |
|---|---|---|
| ADMIN (Superadmin) | admin@snapvault.com | Admin User |
| PHOTOGRAPHER | photographer@snapvault.com | Alex Photographer |
| VIEWER (Event Member) | member@snapvault.com | Jane Member |
| VIEWER (No membership) | viewer@snapvault.com | View Only |

---

## Features

**Authentication** — Email + password with 6-digit OTP verification (10-min expiry), OTP resend, forgot-password via secure JWT reset link (1-hour expiry), 30-day JWT sessions.

**Events** — Create events with name, description, date, location, cover image, and one of 8 categories (Photoshoot, Workshop, Trip, Competition, Cultural, Party, Sports, Other). Public/private toggle. Filter by category, sort by date or name, text search.

**Media Upload** — Drag-and-drop multi-file upload for photos (JPEG, PNG, WebP) and videos (MP4, WebM, MOV) up to 50 MB each. Duplicate detection checks file size within the event before uploading. Files stored on Cloudinary CDN at full quality; 800px thumbnails auto-generated for fast grid loading.

**Albums** — Organize event media into named albums. QR code generation for direct album sharing links.

**AI Auto-Tagging** — Cloudinary Vision API analyzes each photo for faces (`portrait`, `group`, `crowd`, `selfie`), colors (`indoor`/`outdoor`, `daylight`/`night`, `warm`/`cool`), and aspect ratio (`landscape`, `vertical`). Toggle per upload or bulk-tag from the AI panel. Tags are clickable and link to search results.

**Face Search** — Upload a selfie as your reference image. Platform crops your face to a 24×24 greyscale pixel fingerprint and runs Normalized Cross-Correlation (NCC) against face crops from recent event photos. Photos scoring above 0.25 similarity are returned as matches. Confidence scores (0–1) stored per match. Respects role-based visibility — you only search photos you can access. Capped at 12 photos per search to fit within Vercel's 10s function timeout.

**Search** — Global search across photos, events, and users. Filter by date range. Click any AI tag to find similar photos. Popular tag chips for quick discovery. Tabbed results (All / Photos / Events / People), debounced at 300ms.

**Social** — Like (toggle with real-time notification), comment (threaded), favorite/bookmark, tag friends in photos (sends TAG notification), follow/unfollow users.

**Downloads** — One-click download with automatic watermarking (event name + user role, 60% opacity, bottom-right). ADMIN and PHOTOGRAPHER roles download without watermark. Every download is logged with watermark status for analytics.

**Real-Time Notifications** — Pusher WebSocket delivers instant notifications for likes, comments, tags, follows, and system messages. Bell icon with unread badge. Mark individual or all as read.

**Dashboard** — Platform stats (events, media, uploads, likes), role-aware latest photos, recent events, quick action buttons.

**Admin Dashboard** — 10+ metrics (users, media, events, likes, comments, downloads, storage MB, AI-tagged count, face matches, videos, total engagement), inline role management, top 5 most-liked photos.

**Profile** — Avatar with camera badge if a face selfie is saved, role badge, upload/like/favorite/download stats, tabbed media views (Uploads / Liked / Favorites), settings page for name, email, password, avatar, bio.

---

## How It Works

### Member-Only Visibility

Every media item has a `memberOnly` boolean:

| Who uploads | `memberOnly` | Who can see |
|---|---|---|
| ADMIN / CLUB_ADMIN / PHOTOGRAPHER | `false` | Everyone with event access |
| VIEWER with EventMember | `true` | Only EventMembers + admins of that event |

Attendees can privately share phone photos within the group without exposing them publicly.

### Upload Permissions

| Role | Public event | Private event |
|---|---|---|
| ADMIN / CLUB_ADMIN | Can upload | Can upload |
| PHOTOGRAPHER | Can upload | Can upload if EventMember |
| VIEWER | Cannot upload | Can upload if EventMember |

### Watermark Logic

Watermarks are applied at download time via Cloudinary's transformation API — no separate file is stored. The overlay text includes the event name and the downloader's role (e.g. `Annual Fest · VIEWER`), positioned bottom-right at 60% opacity with a drop shadow. ADMIN and PHOTOGRAPHER roles receive a clean copy. Every download — watermarked or not — is recorded in the `downloads` table with the `watermarked` boolean for usage analytics.

### Face Search Algorithm

Standard face recognition (FaceNet, DeepFace) requires GPU inference — incompatible with Vercel's 10-second function timeout. Pixora uses a lightweight pixel-level approach instead:

1. User saves a selfie → Cloudinary crops primary face → resized to 24×24 greyscale
2. For each candidate photo → Cloudinary returns face bounding boxes
3. Each face crop resized to 24×24 greyscale using `sharp`
4. NCC score = normalized dot product of pixel vectors (zero-mean, unit-variance)
5. Score ≥ 0.25 → match saved to `face_matches` table with confidence score
6. Stale matches below threshold are deleted on each run
7. Results ranked by confidence, filtered by user's visibility permissions

NCC is lighting-invariant because it normalizes by mean and variance. It works reliably for club event photos where faces are front-facing and lighting is consistent.

---

## Role Guide

**ADMIN** — Full platform access. Manages all users, events, media. Accesses `/admin` dashboard. Promotes/demotes roles. Downloads without watermark.

**CLUB_ADMIN** — Creates and manages their own events. Adds EventAdmins and EventMembers. Cannot access global admin or other clubs' events.

**PHOTOGRAPHER** — Uploads to any public event, or private events they are an EventMember of. Uploads are always public (`memberOnly = false`). Downloads without watermark. Cannot create events.

**VIEWER** — Default role for all new users. Browses public events and media. Can upload only as an EventMember — those uploads are `memberOnly = true`, visible only to admins and fellow members of that event.

### Permission Matrix

| Action | ADMIN | CLUB_ADMIN | PHOTOGRAPHER | VIEWER |
|---|---|---|---|---|
| Access `/admin` dashboard | Yes | No | No | No |
| Create events | Yes | Yes | No | No |
| Manage event members | Yes | Own events | No | No |
| Upload to public events | Yes | Yes | Yes | No |
| Upload as EventMember | Yes | Yes | Yes | Yes |
| View memberOnly media | Yes | Own events | No | If EventMember |
| Download without watermark | Yes | No | Yes | No |
| Promote user roles | Yes | No | No | No |
| Like / comment / favorite | Yes | Yes | Yes | Yes |
| Follow users | Yes | Yes | Yes | Yes |
| Run face search | Yes | Yes | Yes | Yes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma v5 |
| Database | PostgreSQL via Supabase (free tier) |
| Auth | NextAuth.js v5 (JWT, credentials provider) |
| Media storage | Cloudinary (CDN, watermarking, face detection, AI tagging) |
| Real-time | Pusher Channels (WebSocket, free tier) |
| Email | Gmail SMTP via Nodemailer |
| Image processing | sharp (NCC face fingerprint comparison) |
| Animations | Framer Motion |
| State / data | Zustand, SWR, React Query |
| Validation | Zod |
| Deployment | Vercel (free tier) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # login, register, verify-email, forgot-password, reset-password
│   ├── (main)/
│   │   ├── dashboard/   # stats, recent photos, quick actions
│   │   ├── events/      # list, detail, edit
│   │   ├── upload/      # drag-and-drop upload
│   │   ├── ai/          # AI tagging + face search
│   │   ├── search/      # global search with tag + date filters
│   │   ├── profile/     # user profile + settings
│   │   ├── media/       # media viewer, comments, social
│   │   ├── notifications/
│   │   └── admin/       # ADMIN-only dashboard
│   └── api/             # all REST endpoints (see API Routes)
├── components/
│   ├── ui/              # Button, Input, Card, Badge, Dialog, Tabs, Select …
│   ├── media/           # MediaGrid, MediaActions, CommentSection, TagFriend
│   ├── events/          # EventCard, EventFilters, EventMemberManager, QRCodeShare
│   ├── notifications/   # NotificationBell (live Pusher)
│   └── admin/           # UserRoleManager
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # Prisma singleton
│   ├── cloudinary.ts    # upload, thumbnail, watermark, face crop
│   ├── pusher.ts        # server-side event triggers
│   ├── email.ts         # OTP + password reset templates
│   ├── ai.ts            # Cloudinary Vision tag generation
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # cn(), formatBytes, formatDate, constants
├── types/
└── middleware.ts         # auth guard + route protection

prisma/
├── schema.prisma         # 14 models + enums
└── seed.ts               # 4 demo accounts + 2 sample events
```

---

## Database Schema

14 tables. Full DBML: [schema.dbml](schema.dbml) | Interactive: [dbdiagram.io](https://dbdiagram.io/d/6a26cbf025fc5bf036b9f762)

| Table | Purpose |
|---|---|
| `users` | Accounts, roles, OTP fields, reference selfie URL |
| `follows` | User follow graph |
| `events` | Metadata, category, public/private flag |
| `event_admins` | Per-event admin assignments |
| `event_members` | Per-event membership (gates upload + visibility) |
| `albums` | Media grouping within events |
| `media` | Photos/videos — URL, publicId, `memberOnly`, `aiTags[]` |
| `likes` / `comments` / `favorites` / `media_tags` | Social interactions |
| `notifications` | All notification types with sender and link |
| `face_matches` | NCC confidence scores per (user, media) pair |
| `downloads` | Audit log with watermark status |

**Enums:** `Role` (ADMIN · CLUB_ADMIN · PHOTOGRAPHER · VIEWER) · `MediaType` (IMAGE · VIDEO) · `NotificationType` (LIKE · COMMENT · TAG · SHARE · FOLLOW · SYSTEM) · `EventCategory` (PHOTOSHOOT · WORKSHOP · TRIP · COMPETITION · CULTURAL · PARTY · SPORTS · OTHER)

---

## Environment Variables

```env
DATABASE_URL="postgresql://..."        # Supabase pooled (pgbouncer)
DIRECT_URL="postgresql://..."          # Supabase direct (migrations)
AUTH_SECRET="32-char-secret"
NEXTAUTH_SECRET="32-char-secret"
NEXTAUTH_URL="http://localhost:3000"   # local only — omit on Vercel
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
PUSHER_APP_ID=""
PUSHER_KEY=""
PUSHER_SECRET=""
PUSHER_CLUSTER="ap2"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="ap2"
HUGGINGFACE_API_KEY=""
EMAIL_USER=""                          # Gmail address
EMAIL_PASS=""                          # Gmail App Password (not account password)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Pixora"
```

| Service | Free Tier |
|---|---|
| Supabase | 500 MB DB, 2 projects |
| Cloudinary | 25 GB storage + bandwidth/month |
| Pusher Channels | 100 connections, 200k messages/day |
| Gmail SMTP | Free — myaccount.google.com → Security → App Passwords |

---

## Local Setup

```bash
git clone https://github.com/Lakshya44444/CIG_OP_WEBD_FINAL
cd CIG_OP_WEBD_FINAL
npm install
# fill in .env with your values
npx prisma db push
npx prisma db seed    # creates 4 demo accounts + 2 sample events
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Admin without seed:** register → Supabase dashboard or `npx prisma studio` → set `role` to `ADMIN` → log back in.

### What the seed creates

| Account | Role | Pre-configured membership |
|---|---|---|
| admin@snapvault.com | ADMIN | Full access everywhere |
| photographer@snapvault.com | PHOTOGRAPHER | EventMember of Photography Workshop |
| member@snapvault.com | VIEWER | EventMember of Photography Workshop |
| viewer@snapvault.com | VIEWER | No memberships |

Two sample events are created (Photography Workshop, Cultural Fest) plus one album (Day 1 Morning Sessions) so member-only upload behavior is immediately testable after seeding.

---

## Deployment

| Vercel Limit | Value | How Pixora handles it |
|---|---|---|
| Function timeout | 10s | `maxDuration = 10` on upload + face-search; scan capped at 12 photos |
| Function memory | 1024 MB | NCC on 24×24px crops — ~2 KB per image |
| Bandwidth | 100 GB/month | All media from Cloudinary CDN, not Vercel |

1. Push to GitHub → import at [vercel.com/new](https://vercel.com/new)
2. Add all env vars — **omit `NEXTAUTH_URL`**
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL → Deploy

---

## API Routes

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, send OTP |
| POST | `/api/auth/verify-otp` | Verify 6-digit OTP |
| POST | `/api/auth/resend-otp` | Resend expired OTP |
| POST | `/api/auth/forgot-password` | Email JWT reset link |
| POST | `/api/auth/reset-password` | Apply new password |

### Events & Albums
| Method | Route | Description |
|---|---|---|
| GET / POST | `/api/events` | List / create events |
| GET / PUT / DELETE | `/api/events/[id]` | Get / update / delete event |
| GET / POST / DELETE | `/api/events/[id]/members` | Manage EventMembers |
| POST | `/api/events/[id]/admins` | Add EventAdmin |
| GET / POST | `/api/albums` | List / create albums |
| GET / PUT / DELETE | `/api/albums/[id]` | Get / update / delete album |

### Media
| Method | Route | Description |
|---|---|---|
| GET | `/api/media` | List media (role-aware memberOnly filter) |
| POST | `/api/media/upload` | Upload to Cloudinary + optional AI tagging |
| GET / PUT / DELETE | `/api/media/[id]` | Get / update / delete |
| POST | `/api/media/check-duplicate` | File size check within event |
| GET | `/api/media/[id]/download` | Watermarked download + audit log |
| POST | `/api/media/[id]/like` | Toggle like |
| POST | `/api/media/[id]/favorite` | Toggle favorite |
| POST | `/api/media/[id]/comment` | Add comment |

### AI, Social & Search
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/tag` | Generate Cloudinary Vision tags |
| GET / POST | `/api/ai/face-search` | Get cached results / run NCC face search |
| POST | `/api/social/follow/[userId]` | Follow / unfollow |
| POST | `/api/social/tag` | Tag a user in a photo |
| GET | `/api/search` | Search photos, events, users (text + date range) |

### Notifications & Admin
| Method | Route | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications (unread first) |
| PATCH / POST | `/api/notifications/[id]` · `/read-all` | Mark read |
| GET / PUT | `/api/admin/users` · `/[id]` | List / update users |
| POST | `/api/admin/users/[id]/role` | Change user role |
| POST | `/api/pusher/auth` | Authenticate Pusher channels |

---

## Security

- Passwords hashed with **bcryptjs** (salt rounds: 10) - plaintext never stored
- OTP tokens expire after 10 minutes; reset tokens expire after 1 hour
- All authenticated routes protected by `middleware.ts` - unauthenticated requests redirect to `/login`
- Admin routes additionally check `token.role === "ADMIN"` in middleware
- Media visibility enforced server-side on every API route - client-side hiding is cosmetic only
- Cloudinary uploads use server-side signed requests - API secret never exposed to the browser
- Pusher private channels authenticated via `/api/pusher/auth` - no unauthenticated subscriptions
- `NEXTAUTH_URL` intentionally omitted on Vercel; `trustHost: true` in NextAuth config prevents CSRF mismatch on serverless deployments

---

## Built For

This project was built as a submission for the **CIG Web Development Hackathon**. All services used are on free tiers — no paid infrastructure required to run the full platform.

---

## License

MIT
