# CLI Workflows for Ripple

Common command-line workflows for development, deployment, and operations.

---

## Table of Contents

1. [Development Workflows](#development-workflows)
2. [Database Workflows](#database-workflows)
3. [Deployment Workflows](#deployment-workflows)
4. [Debugging Workflows](#debugging-workflows)
5. [Maintenance Workflows](#maintenance-workflows)

---

## Development Workflows

### Starting Development

```bash
# 1. Clone and setup
git clone https://github.com/dobeutech/ripplesocial.git
cd ripplesocial
npm install

# 2. Setup environment
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF

# 3. Start dev server
npm run dev
# Opens at http://localhost:5173
```

### Creating a New Feature

```bash
# 1. Create feature branch
git checkout -b feature/user-profiles

# 2. Make changes
# Edit files...

# 3. Run checks
npm run typecheck
npm run lint

# 4. Test locally
npm run dev

# 5. Commit changes
git add .
git commit -m "Add user profile page

- Display user bio and avatar
- Show user's posts
- Add follow/unfollow button

Co-authored-by: Ona <no-reply@ona.com>"

# 6. Push to remote
git push origin feature/user-profiles

# 7. Create PR (if using GitHub CLI)
gh pr create --title "Add user profile page" --body "Implements user profile viewing"
```

### Fixing a Bug

```bash
# 1. Create fix branch
git checkout -b fix/auth-redirect-loop

# 2. Reproduce bug locally
npm run dev

# 3. Fix the issue
# Edit files...

# 4. Verify fix
npm run typecheck
npm run lint
npm run dev

# 5. Commit with descriptive message
git add .
git commit -m "Fix infinite redirect loop on auth

Root cause: useEffect missing dependency array
Solution: Add empty dependency array to run once

Co-authored-by: Ona <no-reply@ona.com>"

# 6. Push and create PR
git push origin fix/auth-redirect-loop
gh pr create --title "Fix auth redirect loop" --body "Fixes #123"
```

---

## Database Workflows

### Creating a Migration

```bash
# 1. Create migration file
TIMESTAMP=$(date +%Y%m%d%H%M%S)
touch supabase/migrations/${TIMESTAMP}_add_user_settings.sql

# 2. Write migration
cat > supabase/migrations/${TIMESTAMP}_add_user_settings.sql << 'EOF'
-- Add user settings table
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own settings
CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
EOF

# 3. Apply migration in Supabase Dashboard
# Go to SQL Editor, paste migration, execute

# 4. Regenerate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

# 5. Commit migration
git add supabase/migrations/${TIMESTAMP}_add_user_settings.sql src/lib/database.types.ts
git commit -m "Add user settings table

Co-authored-by: Ona <no-reply@ona.com>"
```

### Rolling Back a Migration

```bash
# 1. Create rollback migration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
cat > supabase/migrations/${TIMESTAMP}_rollback_user_settings.sql << 'EOF'
-- Rollback: Remove user settings table
DROP TABLE IF EXISTS user_settings CASCADE;
EOF

# 2. Apply in Supabase Dashboard SQL Editor

# 3. Regenerate types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts

# 4. Commit rollback
git add supabase/migrations/${TIMESTAMP}_rollback_user_settings.sql src/lib/database.types.ts
git commit -m "Rollback user settings table

Co-authored-by: Ona <no-reply@ona.com>"
```

### Seeding Test Data

```bash
# 1. Create seed script
cat > scripts/seed-test-users.sql << 'EOF'
-- Insert test users (assumes auth.users already exist)
INSERT INTO profiles (id, email, first_name, last_name, display_name)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@test.com', 'Alice', 'Smith', 'alice_s'),
  ('00000000-0000-0000-0000-000000000002', 'bob@test.com', 'Bob', 'Jones', 'bob_j')
ON CONFLICT (id) DO NOTHING;

-- Insert test posts
INSERT INTO posts (author_id, content, privacy_level, recipient_type)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test post from Alice', 'public', 'anonymous'),
  ('00000000-0000-0000-0000-000000000002', 'Test post from Bob', 'public', 'anonymous')
ON CONFLICT DO NOTHING;
EOF

# 2. Apply in Supabase Dashboard SQL Editor
# Copy and paste script

# 3. Verify data
# Run in SQL Editor:
# SELECT * FROM profiles WHERE email LIKE '%@test.com';
```

---

## Deployment Workflows

### Deploying to Production

```bash
# 1. Ensure on main branch
git checkout main
git pull origin main

# 2. Run full checks
npm run typecheck && npm run lint && npm run build

# 3. Deploy to Vercel
vercel --prod

# 4. Verify deployment
curl -I https://your-app.vercel.app
# Should return HTTP/2 200

# 5. Smoke test critical paths
# - Sign in
# - Create post
# - View feed
# - Check notifications

# 6. Monitor for 15 minutes
# Check Vercel logs and Supabase metrics
```

### Deploying a Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bug

# 2. Fix the issue
# Edit files...

# 3. Test fix
npm run typecheck && npm run lint && npm run build

# 4. Commit
git add .
git commit -m "Hotfix: Fix critical auth bug

Co-authored-by: Ona <no-reply@ona.com>"

# 5. Push and deploy immediately
git push origin hotfix/critical-auth-bug
vercel --prod

# 6. Merge back to main
git checkout main
git merge hotfix/critical-auth-bug
git push origin main

# 7. Clean up branch
git branch -d hotfix/critical-auth-bug
git push origin --delete hotfix/critical-auth-bug
```

### Rolling Back a Deployment

```bash
# 1. List recent deployments
vercel ls

# 2. Find last known good deployment
# Look for deployment before issue started

# 3. Rollback
vercel rollback DEPLOYMENT_URL

# 4. Verify rollback
curl -I https://your-app.vercel.app

# 5. Monitor for 10 minutes
# Ensure error rates return to normal

# 6. Document incident
# Add entry to incident log
```

---

## Debugging Workflows

### Debugging Authentication Issues

```bash
# 1. Check environment variables
vercel env ls

# 2. Test Supabase connection
curl https://YOUR_PROJECT.supabase.co/auth/v1/health

# 3. Test sign-in endpoint
curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/token \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Check auth logs in Supabase Dashboard
# Dashboard > Logs > Auth Logs

# 5. Check browser console
# Open DevTools > Console
# Look for auth-related errors

# 6. Test with different user
# Try sign-in with known good account
```

### Debugging Database Query Issues

```bash
# 1. Enable query logging in browser
# Add to src/lib/supabase.ts temporarily:
# console.log('Query:', query);

# 2. Check RLS policies
# In Supabase Dashboard > Database > Policies

# 3. Test query in SQL Editor
# Dashboard > SQL Editor
# Run query manually with test user ID

# 4. Check for missing indexes
# Run in SQL Editor:
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY tablename;

# 5. Analyze slow queries
# Dashboard > Database > Query Performance
# Look for queries >1s execution time
```

### Debugging Performance Issues

```bash
# 1. Profile bundle size
npm run build
ls -lh dist/assets/

# 2. Analyze bundle composition
npx vite-bundle-visualizer

# 3. Check for memory leaks
# Open DevTools > Memory > Take heap snapshot
# Interact with app
# Take another snapshot
# Compare snapshots

# 4. Profile React components
# Install React DevTools
# Open Profiler tab
# Record interaction
# Analyze render times

# 5. Check network requests
# Open DevTools > Network
# Filter by XHR/Fetch
# Look for slow or redundant requests
```

---

## Maintenance Workflows

### Updating Dependencies

```bash
# 1. Check for outdated packages
npm outdated

# 2. Update non-breaking changes
npm update

# 3. Update major versions (carefully)
npm install react@latest react-dom@latest

# 4. Test thoroughly
npm run typecheck
npm run lint
npm run build
npm run dev

# 5. Commit updates
git add package.json package-lock.json
git commit -m "Update dependencies

- React 18.2 -> 18.3
- Vite 5.3 -> 5.4

Co-authored-by: Ona <no-reply@ona.com>"
```

### Security Audit

```bash
# 1. Run npm audit
npm audit

# 2. Fix automatically if possible
npm audit fix

# 3. Review manual fixes needed
npm audit fix --force
# WARNING: May introduce breaking changes

# 4. Check for vulnerable dependencies
npm audit --production

# 5. Update specific vulnerable package
npm install package-name@latest

# 6. Verify fixes
npm audit
npm run typecheck
npm run lint
npm run build
```

### Database Maintenance

```bash
# 1. Check database size
# Run in Supabase SQL Editor:
SELECT pg_size_pretty(pg_database_size(current_database()));

# 2. Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# 3. Vacuum tables
VACUUM ANALYZE posts;
VACUUM ANALYZE profiles;

# 4. Reindex if needed
REINDEX TABLE posts;

# 5. Update statistics
ANALYZE posts;
ANALYZE profiles;
```

### Backup and Restore

```bash
# 1. Create manual backup
# In Supabase Dashboard > Database > Backups
# Click "Create backup"

# 2. Download backup (if needed)
# Dashboard > Database > Backups > Download

# 3. Restore from backup
# Dashboard > Database > Backups
# Select backup point
# Click "Restore"
# WARNING: This overwrites current data

# 4. Verify restore
# Check critical tables in SQL Editor
SELECT count(*) FROM posts;
SELECT count(*) FROM profiles;
```

### Monitoring Setup

```bash
# 1. Install Sentry for error tracking
npm install @sentry/react

# 2. Configure Sentry
cat >> src/main.tsx << 'EOF'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
EOF

# 3. Add environment variable
vercel env add VITE_SENTRY_DSN

# 4. Deploy
vercel --prod

# 5. Verify errors are tracked
# Trigger test error
# Check Sentry dashboard
```

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run typecheck        # Type check without building
npm run lint             # Run ESLint

# Git
git status               # Check working directory
git diff                 # View changes
git log --oneline -5     # View recent commits
git checkout -b name     # Create new branch
git push origin name     # Push branch to remote

# Vercel
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
vercel ls                # List deployments
vercel logs URL          # View deployment logs
vercel rollback URL      # Rollback to deployment
vercel env ls            # List environment variables

# Database
# All database commands run in Supabase Dashboard > SQL Editor
```

### Environment Variables

```bash
# Required for local development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional for monitoring
VITE_SENTRY_DSN=your-sentry-dsn
VITE_POSTHOG_KEY=your-posthog-key
```

### Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Ripple aliases
alias rdev='npm run dev'
alias rbuild='npm run typecheck && npm run lint && npm run build'
alias rdeploy='vercel --prod'
alias rlogs='vercel logs'
alias rrollback='vercel rollback'

# Git aliases
alias gs='git status'
alias gd='git diff'
alias gl='git log --oneline -10'
alias gp='git push origin $(git branch --show-current)'
```

---

**Last Updated:** 2024-12-14  
**Maintainer:** Development Team
