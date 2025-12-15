# Ripple Social Platform

A positive impact social media platform built with React, TypeScript, and Supabase.

---

## Overview

Ripple is a social media platform focused on sharing positive stories about how people impact others' lives. Users can create posts about meaningful interactions, tag recipients, and build a community centered on gratitude and positive impact.

### Key Features

- ✅ **Authentication** - Sign up, sign in, session management
- ✅ **Post Creation** - Share stories with privacy controls
- ✅ **Feed System** - Public feed, top stories, tagged posts
- ✅ **Engagement** - Like posts, comment, notifications
- ✅ **Privacy Controls** - Public, private, recipient-only posts
- ✅ **User Profiles** - Customizable profiles with avatars
- ✅ **Notifications** - Real-time notifications for interactions

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Icons:** Lucide React
- **Linting:** ESLint 9
- **Deployment:** Vercel

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/dobeutech/ripplesocial.git
cd ripplesocial

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` with:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Development

### Available Scripts

```bash
npm run dev        # Start dev server (port 5173)
npm run build      # Build for production
npm run preview    # Preview production build
npm run typecheck  # Type check without building
npm run lint       # Run ESLint
```

### Project Structure

```
ripple/
├── src/
│   ├── components/     # React components
│   │   ├── auth/      # Authentication UI
│   │   ├── feed/      # Feed display
│   │   ├── posts/     # Post creation/display
│   │   └── ui/        # Reusable UI components
│   ├── contexts/      # React contexts
│   ├── lib/           # Utilities and Supabase client
│   └── config/        # App configuration
├── supabase/
│   └── migrations/    # Database migrations
└── scripts/           # Utility scripts
```

---

## Documentation

- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** - Complete documentation guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and diagrams
- **[AGENTS.md](./AGENTS.md)** - Guide for working with Ona Agent
- **[RUNBOOK.md](./RUNBOOK.md)** - Operational runbook for on-call engineers
- **[CLI_WORKFLOWS.md](./CLI_WORKFLOWS.md)** - Common CLI workflows
- **[AUTOMATION_PLAN.md](./AUTOMATION_PLAN.md)** - CI/CD and automation roadmap
- **[COST_REVIEW.md](./COST_REVIEW.md)** - Cost analysis and optimization
- **[PRODUCTION_PLAN.md](./PRODUCTION_PLAN.md)** - Production readiness plan
- **[CODE_REVIEW.md](./CODE_REVIEW.md)** - Code review findings
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Implementation notes

---

## Database

### Migrations

Database migrations are located in `supabase/migrations/`. Apply them via:

1. Supabase Dashboard > SQL Editor
2. Copy migration content and execute
3. Regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

### Schema

Key tables:
- `profiles` - User profiles
- `posts` - User posts/stories
- `post_likes` - Post engagement
- `comments` - Post comments
- `notifications` - User notifications
- `pending_recipient_matches` - Anonymous recipient matching
- `verification_requests` - ID verification
- `user_blocks` - User blocking

---

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Add these in Vercel Dashboard > Settings > Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Contributing

### Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test locally
3. Run checks: `npm run typecheck && npm run lint`
4. Commit with descriptive message
5. Push and create pull request

### Commit Message Format

```
<type>: <description>

<body>

Co-authored-by: Ona <no-reply@ona.com>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## Production Status

**Current Status:** Development/Staging  
**Production Readiness:** 60-70%

### Production Blockers

- ❌ No automated tests
- ❌ No CI/CD pipeline
- ❌ No error monitoring
- ❌ No performance monitoring

See [PRODUCTION_PLAN.md](./PRODUCTION_PLAN.md) for detailed roadmap.

---

## Security

### Reporting Security Issues

Please report security vulnerabilities to: security@dobeutech.com

### Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Input sanitization for SQL injection prevention
- ✅ JWT-based authentication
- ✅ Secure session management
- ✅ HTTPS only

---

## License

[Add your license here]

---

## Support

- **Issues:** [GitHub Issues](https://github.com/dobeutech/ripplesocial/issues)
- **Discussions:** [GitHub Discussions](https://github.com/dobeutech/ripplesocial/discussions)
- **Email:** support@dobeutech.com

---

## Acknowledgments

Built with:
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vitejs.dev)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)

---

**Last Updated:** 2024-12-14  
**Version:** 0.1.0  
**Status:** Development
