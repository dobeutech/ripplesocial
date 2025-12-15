# Automation Plan for Ripple

Roadmap for implementing CI/CD, testing, monitoring, and operational automation.

---

## Table of Contents

1. [Current State](#current-state)
2. [Phase 1: Pre-Commit Automation](#phase-1-pre-commit-automation)
3. [Phase 2: CI/CD Pipeline](#phase-2-cicd-pipeline)
4. [Phase 3: Testing Automation](#phase-3-testing-automation)
5. [Phase 4: Deployment Automation](#phase-4-deployment-automation)
6. [Phase 5: Monitoring & Alerting](#phase-5-monitoring--alerting)
7. [Phase 6: Database Automation](#phase-6-database-automation)
8. [Implementation Timeline](#implementation-timeline)

---

## Current State

### What Exists ✅
- Manual deployment via Vercel CLI
- Manual type checking (`npm run typecheck`)
- Manual linting (`npm run lint`)
- Manual database migrations via Supabase Dashboard

### What's Missing ❌
- No pre-commit hooks
- No CI/CD pipeline
- No automated testing
- No automated deployments
- No monitoring/alerting
- No automated database migrations
- No automated backups

---

## Phase 1: Pre-Commit Automation

**Goal:** Catch issues before they reach the repository

### 1.1 Setup Husky

```bash
# Install Husky
npm install -D husky
npx husky install

# Add to package.json
npm pkg set scripts.prepare="husky install"
```

### 1.2 Create Pre-Commit Hook

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Type check
echo "📝 Type checking..."
npm run typecheck || exit 1

# Lint
echo "🔧 Linting..."
npm run lint || exit 1

# Check for console.log (warning only)
echo "🔎 Checking for console statements..."
git diff --cached --name-only | grep -E '\.(ts|tsx)$' | xargs grep -n "console\\.log" && \
  echo "⚠️  Warning: console.log found"

echo "✅ Pre-commit checks passed!"
```

### 1.3 Create Commit Message Hook

**File:** `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
commit_msg=$(cat "$1")

# Check for minimum length
if [ ${#commit_msg} -lt 10 ]; then
  echo "❌ Commit message too short (minimum 10 characters)"
  exit 1
fi

# Check for Co-authored-by
if ! grep -q "Co-authored-by: Ona" "$1"; then
  echo "⚠️  Warning: Missing Ona co-author attribution"
  echo "Add: Co-authored-by: Ona <no-reply@ona.com>"
fi

echo "✅ Commit message validated"
```

### 1.4 Setup lint-staged

```bash
# Install lint-staged
npm install -D lint-staged

# Add to package.json
cat >> package.json << 'EOF'
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
EOF

# Update pre-commit hook
echo "npx lint-staged" >> .husky/pre-commit
```

**Estimated Time:** 2 hours  
**Priority:** High  
**Dependencies:** None

---

## Phase 2: CI/CD Pipeline

**Goal:** Automated testing and deployment on every push

### 2.1 GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

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
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --production
      
      - name: Check for vulnerabilities
        run: npm audit --audit-level=high
```

### 2.2 Pull Request Checks

**File:** `.github/workflows/pr-checks.yml`

```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Check PR title
        run: |
          if [[ ! "${{ github.event.pull_request.title }}" =~ ^(feat|fix|docs|refactor|test|chore): ]]; then
            echo "❌ PR title must start with: feat|fix|docs|refactor|test|chore"
            exit 1
          fi
      
      - name: Check for breaking changes
        run: |
          if git diff --name-only origin/main | grep -q "supabase/migrations/"; then
            echo "⚠️  Database migration detected - review carefully"
          fi
      
      - name: Check bundle size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 2.3 Automated Deployment

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployment to production completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

**Estimated Time:** 4 hours  
**Priority:** High  
**Dependencies:** GitHub repository, Vercel account

---

## Phase 3: Testing Automation

**Goal:** Automated unit, integration, and E2E tests

### 3.1 Setup Vitest

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom @vitest/ui

# Add to package.json
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.test:coverage="vitest --coverage"
```

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.2 Test Setup File

**File:** `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### 3.3 Example Component Tests

**File:** `src/components/posts/__tests__/post-card.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PostCard } from '../post-card';

describe('PostCard', () => {
  it('renders post content', () => {
    const post = {
      id: '1',
      content: 'Test post',
      author_first_name: 'John',
      created_at: new Date().toISOString(),
      like_count: 0,
      comment_count: 0,
    };

    render(<PostCard post={post} />);
    expect(screen.getByText('Test post')).toBeInTheDocument();
  });

  it('handles like button click', async () => {
    const post = {
      id: '1',
      content: 'Test post',
      author_first_name: 'John',
      created_at: new Date().toISOString(),
      like_count: 0,
      comment_count: 0,
    };

    const onLike = vi.fn();
    render(<PostCard post={post} onLike={onLike} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);
    
    expect(onLike).toHaveBeenCalledWith('1');
  });
});
```

### 3.4 Add Tests to CI

Update `.github/workflows/ci.yml`:

```yaml
- name: Run tests
  run: npm run test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

**Estimated Time:** 2 weeks  
**Priority:** Critical  
**Dependencies:** Phase 2 (CI/CD)

---

## Phase 4: Deployment Automation

**Goal:** Zero-downtime deployments with automatic rollback

### 4.1 Vercel Integration

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add secrets to GitHub
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
```

### 4.2 Preview Deployments

**File:** `.github/workflows/preview.yml`

```yaml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        id: vercel-deploy
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
      
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ Preview deployed: ${{ steps.vercel-deploy.outputs.preview-url }}`
            })
```

### 4.3 Automatic Rollback

**File:** `.github/workflows/rollback.yml`

```yaml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      deployment_url:
        description: 'Deployment URL to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    
    steps:
      - name: Rollback deployment
        run: |
          vercel rollback ${{ github.event.inputs.deployment_url }} --token ${{ secrets.VERCEL_TOKEN }}
      
      - name: Notify team
        uses: 8398a7/action-slack@v3
        with:
          status: 'warning'
          text: 'Production rolled back to ${{ github.event.inputs.deployment_url }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Estimated Time:** 1 week  
**Priority:** High  
**Dependencies:** Phase 2 (CI/CD)

---

## Phase 5: Monitoring & Alerting

**Goal:** Proactive issue detection and alerting

### 5.1 Setup Sentry

```bash
# Install Sentry
npm install @sentry/react

# Add to src/main.tsx
cat >> src/main.tsx << 'EOF'
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
EOF
```

### 5.2 Setup Uptime Monitoring

**File:** `.github/workflows/uptime.yml`

```yaml
name: Uptime Check

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  check:
    runs-on: ubuntu-latest
    
    steps:
      - name: Check production
        run: |
          response=$(curl -s -o /dev/null -w "%{http_code}" https://your-app.vercel.app)
          if [ $response -ne 200 ]; then
            echo "❌ Production is down (HTTP $response)"
            exit 1
          fi
      
      - name: Alert on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: 'failure'
          text: '🚨 Production is down!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 5.3 Performance Monitoring

```bash
# Install PostHog
npm install posthog-js

# Add to src/main.tsx
import posthog from 'posthog-js';

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
  autocapture: true,
});
```

### 5.4 Database Monitoring

**File:** `scripts/monitor-db.sql`

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW monitoring_metrics AS
SELECT
  'connection_count' as metric,
  count(*)::text as value,
  now() as timestamp
FROM pg_stat_activity
UNION ALL
SELECT
  'active_queries' as metric,
  count(*)::text as value,
  now() as timestamp
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT
  'database_size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value,
  now() as timestamp;

-- Create alert function
CREATE OR REPLACE FUNCTION check_connection_threshold()
RETURNS void AS $$
DECLARE
  conn_count integer;
BEGIN
  SELECT count(*) INTO conn_count FROM pg_stat_activity;
  
  IF conn_count > 80 THEN
    RAISE WARNING 'High connection count: %', conn_count;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

**Estimated Time:** 1 week  
**Priority:** High  
**Dependencies:** None

---

## Phase 6: Database Automation

**Goal:** Automated migrations, backups, and maintenance

### 6.1 Automated Migrations

**File:** `.github/workflows/migrate.yml`

```yaml
name: Database Migration

on:
  push:
    branches: [main]
    paths:
      - 'supabase/migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
      
      - name: Run migrations
        run: |
          supabase db push --db-url ${{ secrets.SUPABASE_DB_URL }}
      
      - name: Regenerate types
        run: |
          npx supabase gen types typescript --project-id ${{ secrets.SUPABASE_PROJECT_ID }} > src/lib/database.types.ts
      
      - name: Commit types
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add src/lib/database.types.ts
          git commit -m "Update database types" || echo "No changes"
          git push
```

### 6.2 Automated Backups

**File:** `.github/workflows/backup.yml`

```yaml
name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Create backup
        run: |
          curl -X POST https://api.supabase.com/v1/projects/${{ secrets.SUPABASE_PROJECT_ID }}/database/backups \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}" \
            -H "Content-Type: application/json"
      
      - name: Verify backup
        run: |
          # Check backup was created successfully
          curl https://api.supabase.com/v1/projects/${{ secrets.SUPABASE_PROJECT_ID }}/database/backups \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_KEY }}"
```

### 6.3 Database Maintenance

**File:** `scripts/maintenance.sql`

```sql
-- Run weekly maintenance
DO $$
BEGIN
  -- Vacuum all tables
  EXECUTE 'VACUUM ANALYZE posts';
  EXECUTE 'VACUUM ANALYZE profiles';
  EXECUTE 'VACUUM ANALYZE notifications';
  
  -- Reindex if needed
  EXECUTE 'REINDEX TABLE posts';
  
  -- Update statistics
  EXECUTE 'ANALYZE posts';
  EXECUTE 'ANALYZE profiles';
END $$;
```

**File:** `.github/workflows/maintenance.yml`

```yaml
name: Database Maintenance

on:
  schedule:
    - cron: '0 3 * * 0'  # Weekly on Sunday at 3 AM UTC

jobs:
  maintain:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run maintenance
        run: |
          psql ${{ secrets.SUPABASE_DB_URL }} -f scripts/maintenance.sql
```

**Estimated Time:** 1 week  
**Priority:** Medium  
**Dependencies:** Phase 2 (CI/CD)

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Phase 1: Pre-commit automation (2 hours)
- [ ] Phase 2: CI/CD pipeline (4 hours)
- [ ] Setup GitHub Actions
- [ ] Configure Vercel integration

### Week 3-4: Testing
- [ ] Phase 3: Testing automation (2 weeks)
- [ ] Setup Vitest
- [ ] Write unit tests (target 70% coverage)
- [ ] Add integration tests

### Week 5-6: Deployment & Monitoring
- [ ] Phase 4: Deployment automation (1 week)
- [ ] Phase 5: Monitoring & alerting (1 week)
- [ ] Setup Sentry
- [ ] Configure uptime checks
- [ ] Add performance monitoring

### Week 7-8: Database & Polish
- [ ] Phase 6: Database automation (1 week)
- [ ] Automated migrations
- [ ] Automated backups
- [ ] Documentation updates
- [ ] Team training

---

## Success Metrics

### Phase 1
- ✅ 100% of commits pass pre-commit checks
- ✅ Zero commits with console.log in production

### Phase 2
- ✅ All PRs automatically tested
- ✅ Zero manual deployments
- ✅ Build time < 5 minutes

### Phase 3
- ✅ 70%+ code coverage
- ✅ All critical paths tested
- ✅ Test suite runs < 2 minutes

### Phase 4
- ✅ Zero-downtime deployments
- ✅ Rollback time < 2 minutes
- ✅ Preview deployments on all PRs

### Phase 5
- ✅ Error detection < 1 minute
- ✅ Uptime > 99.9%
- ✅ P95 response time < 500ms

### Phase 6
- ✅ Migrations applied automatically
- ✅ Daily backups with 30-day retention
- ✅ Weekly maintenance runs successfully

---

## Cost Estimate

### Tools & Services
- **GitHub Actions:** Free (2,000 minutes/month)
- **Vercel Pro:** $20/month
- **Sentry:** $26/month (Developer plan)
- **PostHog:** Free (1M events/month)
- **Supabase Pro:** $25/month

**Total:** ~$71/month

### Development Time
- **Phase 1:** 2 hours
- **Phase 2:** 4 hours
- **Phase 3:** 80 hours (2 weeks)
- **Phase 4:** 40 hours (1 week)
- **Phase 5:** 40 hours (1 week)
- **Phase 6:** 40 hours (1 week)

**Total:** ~206 hours (~5 weeks for 1 developer)

---

## Rollout Strategy

### Stage 1: Development Environment
1. Implement Phase 1 (pre-commit hooks)
2. Test with team for 1 week
3. Gather feedback and iterate

### Stage 2: CI/CD
1. Implement Phase 2 (GitHub Actions)
2. Run in parallel with manual process
3. Verify builds match manual builds
4. Switch to automated after 1 week

### Stage 3: Testing
1. Implement Phase 3 (Vitest)
2. Start with critical components
3. Gradually increase coverage
4. Make tests required after 50% coverage

### Stage 4: Full Automation
1. Implement Phases 4-6
2. Monitor closely for 2 weeks
3. Document any issues
4. Train team on new workflows

---

## Maintenance Plan

### Daily
- Monitor CI/CD pipeline health
- Review failed builds
- Check error rates in Sentry

### Weekly
- Review test coverage trends
- Check database performance
- Review deployment metrics

### Monthly
- Update dependencies
- Review and update automation scripts
- Audit security vulnerabilities
- Review and optimize costs

### Quarterly
- Review automation effectiveness
- Update runbooks
- Team training on new features
- Plan automation improvements

---

**Last Updated:** 2024-12-14  
**Owner:** Development Team  
**Next Review:** 2025-01-14
