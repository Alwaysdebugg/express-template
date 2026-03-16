# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MoodTrack Express Backend — a RESTful API for mood tracking with community features. Built with Express.js 5.x, Supabase (PostgreSQL), JWT + Google OAuth authentication.

## Commands

- **Dev server**: `npm run dev` (nodemon with auto-reload)
- **Start**: `npm start` (same as dev)
- **No test suite exists** — `npm test` is a placeholder
- **JWT test script**: `bash Doc/test-jwt.sh`
- **Format**: Prettier config in `.prettierrc` (2-space indent, single quotes, semicolons, trailing commas)

## Architecture

MVC pattern: **Routes** (`routers/`) → **Controllers** (`controllers/`) → **Models** (`models/`) → **Supabase**

### Entry Point

`index.js` — sets up middleware stack (CORS, JSON parsing, request logging), mounts routes at `/api/*` and `/oauth2/*`, global error handler.

### Authentication Flow

- Registration/login produces a JWT (HS256, 24h expiry) via `utils/jwtUtils.js`
- `middleware/authMiddleware.js` provides two middlewares:
  - `authenticateToken` — required auth, attaches `req.user`
  - `optionalAuth` — allows unauthenticated requests (used on public community endpoints)
- Google OAuth via Passport.js (`config/passport.js`) + `google-auth-library` credential verification

### Database

Two Supabase clients in `config/supabase.js`:
- `supabase` (anon key) — client-side operations
- `supabaseAdmin` (service_role key) — bypasses RLS for server operations

Schema: 7 tables — `users`, `moods`, `interactions`, `comments`, `online_users`, `topics`, `mood_topics`. Full schema in `Doc/DATABASE_SCHEMA.md`, setup SQL in `Doc/supabase-setup.sql`.

### API Response Format

All endpoints return:
```json
{ "success": true/false, "data": {}, "message": "...", "error": "..." }
```

### Route Groups

- `/api/auth` — register, login, Google OAuth, token verification
- `/api/users` — CRUD user management
- `/api/moods` — mood records (all protected)
- `/api/community` — public moods, interactions (like/unlike/empathy), comments, topics, online status
- `/oauth2` — Google OAuth entry point

### Key Patterns

- Models export plain objects with async functions (not classes), all using Supabase client
- Anonymous posting: `is_anonymous` flag + consistent hash-based pseudonym generation in `models/Moods.js`
- `moods` table has denormalized `likes_count`/`reply_count` fields for read performance
- Path aliases defined in `jsconfig.json` (`@config/*`, `@controllers/*`, etc.) but not actively used in imports

## Environment Setup

Copy `.env.example` to `.env`. Required variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`.
