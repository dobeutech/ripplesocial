# Ona Agent Guide for Ripple Social Platform

This guide helps developers work effectively with Ona Agent on the Ripple project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start Commands](#quick-start-commands)
3. [Development Workflow](#development-workflow)
4. [Common Tasks](#common-tasks)
5. [Database Operations](#database-operations)
6. [Testing Strategy](#testing-strategy)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Icons: Lucide React
- Linting: ESLint 9

**Project Structure:**
```
ripple/
├── .devcontainer/          # Dev container configuration
├── src/
│   ├── components/         # React components
│   │   ├── auth/          # Authentication UI
│   │   ├── feed/          # Feed display components
│   │   ├── layout/        # Layout components
│   │   ├── notifications/ # Notification system
│   │   ├── posts/         # Post creation/display
│   │   └── ui/            # Reusable UI components
│   ├── contexts/          # React contexts (auth)
│   ├── lib/               # Utilities and Supabase client
│   └── config/            # App configuration
├── supabase/
│   └── migrations/        # Database migrations
├── scripts/               # Utility scripts (seed data)
└── [config files]         # vite, tailwind, tsconfig, etc.
```

---

## Quick Start Commands

### Development Server
```bash
# Start dev server (runs on port 5173)
npm run dev

# With Ona Agent, use exec_preview for accessible URL:
# exec_preview with command "npm run dev" and port 5173
```

### Build & Preview
```bash
# Type check without emitting files
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting
```bash
# Run ESLint
npm run lint

# Auto-fix issues (if available)
npm run lint -- --fix
```

---

## Development Workflow

### Starting a New Feature

**Example: Adding a comment system**

```bash
# 1. Create feature branch
git checkout -b feature/comment-system

# 2. Understand existing patterns
# Read related components first
cat src/components/posts/post-card.tsx
cat src/lib/supabase.ts

# 3. Check database schema
cat supabase/migrations/20251024025029_create_initial_schema.sql | grep -A 20 "comments"

# 4. Implement feature following existing patterns
# - Match component structure in posts/
# - Use existing Supabase patterns from lib/
# - Follow TypeScript types from lib/database.types.ts

# 5. Test locally
npm run dev
npm run typecheck
npm run lint

# 6. Commit with proper message format
git add src/components/posts/comment-section.tsx
git commit -m "Add comment section component

- Display comments with user info
- Handle loading and error states
- Follow existing post-card patterns

Co-authored-by: Ona <no-reply@ona.com>"
```

### Making Database Changes

**Example: Adding a new table**

```bash
# 1. Create new migration file
# Use timestamp format: YYYYMMDDHHMMSS_description.sql
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_bookmarks_table.sql

# 2. Write migration with RLS policies
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_add_bookmarks_table.sql << 'EOF'
-- Add bookmarks feature
CREATE TABLE bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_post_id ON bookmarks(post_id);
EOF

# 3. Apply migration in Supabase dashboard or CLI
# Then regenerate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

---

## Common Tasks

### Adding a New Component

**Pattern to follow:**

```typescript
// src/components/category/component-name.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type ComponentType = Database['public']['Tables']['table_name']['Row'];

export function ComponentName() {
  const [data, setData] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('table_name')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setData(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Environment Variables

**Required variables in `.env.local`:**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Validation is automatic** - see `src/lib/supabase.ts` for checks.

### Working with Supabase Auth

**Check authentication status:**

```typescript
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please sign in</div>;

  return <div>Hello {profile?.display_name}</div>;
}
```

**Sign in/out:**

```typescript
import { supabase } from '@/lib/supabase';

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await supabase.auth.signOut();
```

---

## Database Operations

### Querying Data

**Basic query:**
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('privacy_level', 'public')
  .order('created_at', { ascending: false })
  .limit(10);
```

**Join with profiles:**
```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    author:profiles!author_id(
      id,
      display_name,
      avatar_url
    )
  `)
  .eq('privacy_level', 'public');
```

**Prevent SQL injection (IMPORTANT):**
```typescript
// ❌ WRONG - vulnerable to SQL injection
const search = userInput;
.ilike(`%${search}%`)

// ✅ RIGHT - sanitize input
const sanitized = userInput.replace(/[%_]/g, '\\$&');
.ilike(`%${sanitized}%`)
```

### Inserting Data

```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    author_id: user.id,
    content: 'Post content',
    privacy_level: 'public',
    recipient_type: 'anonymous'
  })
  .select()
  .single();
```

### Updating Data

```typescript
const { error } = await supabase
  .from('profiles')
  .update({ display_name: 'New Name' })
  .eq('id', user.id);
```

### Real-time Subscriptions

```typescript
useEffect(() => {
  const channel = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      },
      (payload) => {
        console.log('New post:', payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## Testing Strategy

### Current State
⚠️ **No automated tests exist yet** - this is a production blocker.

### Recommended Testing Setup

**Install testing dependencies:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

**Add to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Create vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
});
```

**Example test:**
```typescript
// src/components/posts/__tests__/post-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '../post-card';

describe('PostCard', () => {
  it('renders post content', () => {
    const post = {
      id: '1',
      content: 'Test post',
      author_first_name: 'John',
      created_at: new Date().toISOString()
    };

    render(<PostCard post={post} />);
    expect(screen.getByText('Test post')).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

Before committing features:
- [ ] Test in Chrome, Firefox, Safari
- [ ] Test mobile responsive design
- [ ] Test with slow network (DevTools throttling)
- [ ] Test error states (disconnect network)
- [ ] Test loading states
- [ ] Test with empty data
- [ ] Verify no console errors/warnings

---

## Deployment

### Current State
⚠️ **No CI/CD pipeline exists** - manual deployment only.

### Recommended GitHub Actions Workflow

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Manual Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Environment variables needed in Vercel:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Supabase Migrations

**Apply migrations:**
```bash
# Using Supabase CLI
npx supabase db push

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy migration file content
# 3. Execute
```

---

## Troubleshooting

### Common Issues

**1. "Missing Supabase environment variables"**
```bash
# Create .env.local file
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

# Restart dev server
npm run dev
```

**2. TypeScript errors after database changes**
```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

**3. RLS policy blocking queries**
```sql
-- Check policies in Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test query as specific user
SET request.jwt.claims.sub = 'user-uuid';
SELECT * FROM your_table;
```

**4. Build fails with "Cannot find module"**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**5. Vite dev server not accessible**
```bash
# Check if port 5173 is in use
lsof -i :5173

# Use different port
npm run dev -- --port 3000
```

### Debugging Tips

**Enable Supabase debug logging:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  auth: {
    debug: true  // Logs auth events
  }
});
```

**Check network requests:**
```typescript
// Add to supabase.ts for debugging
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

**React DevTools:**
- Install React DevTools browser extension
- Inspect component props and state
- Profile component renders

---

## Ona Agent Specific Commands

### File Operations

```bash
# Read file
str_replace_based_edit_tool view /workspaces/ripple/src/App.tsx

# Edit file (always read first!)
str_replace_based_edit_tool view /workspaces/ripple/src/App.tsx
# Then make changes with str_replace

# Create new file
str_replace_based_edit_tool create /workspaces/ripple/src/components/new-component.tsx
```

### Running Commands

```bash
# Execute command
exec "npm run build"

# Run dev server with preview URL
exec_preview "npm run dev" 5173

# Chain commands
exec "npm run typecheck && npm run lint && npm run build"
```

### Git Operations

```bash
# Check status
exec "git status"

# View diff
exec "git diff src/components/posts/post-card.tsx"

# Stage and commit
exec "git add src/components/posts/post-card.tsx && git commit -m 'Update post card styling

Co-authored-by: Ona <no-reply@ona.com>'"
```

### Project Analysis

```bash
# Find files
exec "find src -name '*.tsx' -type f"

# Search for pattern
exec "grep -r 'useAuth' src/components/"

# Count lines of code
exec "find src -name '*.tsx' -o -name '*.ts' | xargs wc -l"

# Check dependencies
exec "npm list --depth=0"
```

---

## Best Practices

### Code Style

1. **Use TypeScript strictly** - no `any` types
2. **Import types explicitly** - `import type { Type } from '...'`
3. **Use functional components** - no class components
4. **Destructure props** - `function Component({ prop1, prop2 })`
5. **Use optional chaining** - `user?.profile?.name`
6. **Handle errors explicitly** - always try/catch async operations

### Security

1. **Sanitize user input** - especially in database queries
2. **Validate on backend** - never trust client-side validation
3. **Use RLS policies** - every table should have policies
4. **Never expose secrets** - use environment variables
5. **Audit dependencies** - `npm audit` regularly

### Performance

1. **Lazy load components** - `React.lazy()` for routes
2. **Memoize expensive computations** - `useMemo`, `useCallback`
3. **Optimize images** - use appropriate formats and sizes
4. **Limit query results** - always use `.limit()`
5. **Index database columns** - for frequently queried fields

### Git Workflow

1. **Branch naming** - `feature/`, `fix/`, `refactor/`
2. **Commit messages** - imperative mood, explain why
3. **Small commits** - one logical change per commit
4. **Review before push** - `git diff` and `git status`
5. **Co-author attribution** - include Ona in commits

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

## Next Steps

### Immediate Priorities (Production Blockers)

1. **Add Testing Infrastructure**
   - Set up Vitest
   - Write unit tests for components
   - Add integration tests for critical flows
   - Target: 70%+ coverage

2. **Set Up CI/CD**
   - GitHub Actions workflow
   - Automated testing on PR
   - Automated deployment to staging
   - Manual approval for production

3. **Security Audit**
   - Review all RLS policies
   - Audit input sanitization
   - Set up rate limiting
   - Add CSRF protection

4. **Performance Optimization**
   - Add lazy loading
   - Optimize bundle size
   - Add caching strategy
   - Set up CDN

5. **Monitoring & Logging**
   - Set up error tracking (Sentry)
   - Add analytics (PostHog/Plausible)
   - Monitor Supabase usage
   - Set up alerts

See `PRODUCTION_PLAN.md` for detailed roadmap.

---

**Last Updated:** 2024-12-14
**Maintainer:** Development Team
**Ona Agent Version:** Compatible with Claude 4.5 Sonnet
