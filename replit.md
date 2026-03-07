# Ripple - Positive Impact Social Media Platform

## Overview
A social media platform for sharing positive stories about how people impact others' lives. Users can create posts tagging recipients (registered or anonymous), like/bookmark stories, and receive notifications.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite (pure SPA, no backend server)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS
- **Icons**: lucide-react

## Project Structure
```
src/
  App.tsx                          - Main app with feed mode switching
  main.tsx                         - Entry point
  index.css                        - Global styles (Tailwind)
  config/constants.ts              - App constants (polling, limits)
  lib/
    supabase.ts                    - Supabase client initialization
    database.types.ts              - TypeScript types for all database tables
  contexts/
    auth-context.tsx               - Auth context (sign up, sign in, sign out, profile)
  components/
    auth/auth-modal.tsx            - Login/signup modal
    layout/header.tsx              - App header with nav
    feed/feed.tsx                  - Post feed (public, tagged, top, saved)
    posts/post-card.tsx            - Individual post card with like/bookmark
    posts/create-post-modal.tsx    - Create new story modal
    notifications/notification-panel.tsx - Notification sidebar
    ui/                            - Reusable UI components (button, card, input, modal, textarea)
supabase/migrations/               - SQL migration files for database schema
```

## Environment Variables (Secrets)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Database Tables
- `profiles` - User profiles (extends Supabase auth.users)
- `posts` - Stories about positive impact
- `post_likes` - Like tracking
- `bookmarks` - Saved posts
- `comments` - Post comments
- `notifications` - User notifications
- `pending_recipient_matches` - Anonymous recipient matching
- `verification_requests` - ID verification
- `user_blocks` - User blocking

## Development
- Run: `npm run dev` (Vite on port 5000)
- All data operations go through the Supabase JS client directly from the frontend
- Database schema managed via SQL migrations in `supabase/migrations/`
