# Ripple - Celebrate Positive Impact

A social media platform for sharing positive stories about how people impact others' lives. Built with React, TypeScript, and Supabase.

## Overview

Ripple is a community-driven platform where users share stories about meaningful interactions with others. Whether it's a mentor who changed your career, a stranger who brightened your day, or a friend who was always there - Ripple lets you celebrate those moments and build a culture of gratitude.

## Features

- **Authentication** - Email/password sign up and sign in with secure session management via Supabase Auth
- **Post Creation** - Share stories about positive impact with privacy controls (public, private, recipient-only)
- **Feed System** - Browse public stories, top stories, tagged posts, and saved/bookmarked posts
- **Engagement** - Like, comment on, and bookmark posts
- **Recipient Tagging** - Tag the person who made an impact (registered users or anonymous matches)
- **Notifications** - Real-time polling notifications for likes, comments, and tags
- **User Profiles** - Customizable profiles with display names and avatars
- **User Safety** - Block users and report content

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend & Auth | Supabase (PostgreSQL + Auth + RLS) |
| Icons | Lucide React |
| Linting | ESLint 9 |
| Formatting | Prettier |
| Testing | Vitest, Testing Library |
| Deployment | Replit |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project ([create one free](https://supabase.com))

### Installation

```bash
git clone <repository-url>
cd ripplesocial

npm install
```

### Environment Variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (e.g. `https://abc123.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public API key |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Navigate to the SQL Editor in your Supabase dashboard
3. Run the migration files in order from `supabase/migrations/`:
   - `20251024025029_create_initial_schema.sql`
   - `20251024083312_fix_security_and_triggers.sql`
   - `20251215203830_add_bookmarks_table.sql`
4. Optionally seed demo data by running `scripts/seed-demo-data.sql`
5. Copy your project URL and anon key from Settings > API into your `.env.local`

### Development

```bash
npm run dev
```

The app runs on port 5000 by default.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without modifying files |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
  App.tsx                              Main app component with feed modes
  main.tsx                             Entry point
  index.css                            Global styles (Tailwind)
  config/
    constants.ts                       App constants (polling intervals, limits)
  lib/
    supabase.ts                        Supabase client initialization
    database.types.ts                  Generated TypeScript types for DB tables
  contexts/
    auth-context.tsx                   Auth provider (sign up, sign in, sign out, profile)
  components/
    auth/auth-modal.tsx                Login/signup modal
    layout/header.tsx                  App header with navigation
    feed/feed.tsx                      Post feed (public, tagged, top, saved)
    posts/post-card.tsx                Individual post card with like/bookmark
    posts/create-post-modal.tsx        Create new story modal
    notifications/notification-panel.tsx  Notification sidebar
    ui/                                Reusable UI primitives (Button, Card, Input, Modal, Textarea)
    ErrorBoundary.tsx                  Error boundary for graceful error handling
supabase/
  migrations/                          SQL migration files for database schema
scripts/
  seed-demo-data.sql                   Optional demo data for development
```

## Database Schema

Key tables (all protected by Row Level Security):

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (extends Supabase `auth.users`) |
| `posts` | Stories about positive impact |
| `post_likes` | Like tracking |
| `bookmarks` | Saved/bookmarked posts |
| `comments` | Post comments |
| `notifications` | User notifications |
| `pending_recipient_matches` | Anonymous recipient matching |
| `verification_requests` | Identity verification |
| `user_blocks` | User blocking |

## Deployment

### Replit

The app is configured for deployment on Replit. The `npm run build` command produces a static `dist/` directory that is served in production.

### Other Platforms

Since the app is a static SPA, it can be deployed to any static hosting provider:

1. Run `npm run build`
2. Deploy the `dist/` directory
3. Set environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) as build-time variables

## Security

- All database tables use Row Level Security (RLS)
- Authentication handled by Supabase Auth (JWT-based)
- Input sanitization on all user-facing forms
- No secrets stored in client code
- See [SECURITY.md](./SECURITY.md) for vulnerability reporting

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

Copyright (c) 2026 Dobeu Tech Solutions
