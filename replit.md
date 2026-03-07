# Ripple - Positive Impact Social Media Platform

## Overview
A social media platform for sharing positive stories about how people impact others' lives. Users can create posts tagging recipients (registered or anonymous), like/bookmark stories, and receive notifications.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite (pure SPA, no backend server)
- **Database & Auth**: Supabase (PostgreSQL + Auth via Supabase JS client)
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Testing**: Vitest + @testing-library/react
- **Deployment**: Replit static deployment (Vite build to `dist/`)

## Project Structure
```
src/
  App.tsx                              - Main app with feed mode switching
  main.tsx                             - Entry point
  index.css                            - Tailwind imports
  config/constants.ts                  - App constants (polling, limits, auth limits)
  lib/
    supabase.ts                        - Supabase client initialization
    database.types.ts                  - TypeScript types for all database tables
  contexts/
    auth-context.tsx                   - Auth context (sign up, sign in, sign out, profile)
  components/
    ErrorBoundary.tsx                  - Global error boundary
    auth/auth-modal.tsx                - Login/signup modal
    layout/header.tsx                  - App header with nav
    feed/feed.tsx                      - Post feed (public, tagged, top, saved)
    posts/post-card.tsx                - Individual post card with like/bookmark
    posts/create-post-modal.tsx        - Create new story modal with validation
    notifications/notification-panel.tsx - Notification sidebar
    ui/                                - Reusable UI components (button, card, input, modal, textarea)
  test/
    setup.ts                           - Test setup (@testing-library/jest-dom)
    mocks/supabase.ts                  - Supabase mock for tests
    constants.test.ts                  - Constants tests
    ui-components.test.tsx             - UI component tests
    error-boundary.test.tsx            - ErrorBoundary tests
supabase/
  migrations/                          - SQL migration files
  combined_setup.sql                   - All migrations combined for easy setup
scripts/
  seed-demo-data.sql                   - Demo data seed script
```

## Environment Variables (Secrets)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## NPM Scripts
- `npm run dev` - Start Vite dev server on port 5000
- `npm run build` - Production build to `dist/`
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting
- `npm run typecheck` - TypeScript type checking
- `npm run test` - Run tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

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

## Key Design Decisions
- All data operations go through the Supabase JS client directly from the frontend
- No custom backend server — Supabase handles auth, RLS, and database
- Static deployment (Vite build output served directly)
- Chunk splitting: vendor (react), supabase, and app code in separate chunks
- Input validation with character limits on post content and recipient names
- Password minimum length and email length validation on auth forms
