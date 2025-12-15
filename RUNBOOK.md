# Ripple Operational Runbook

**Version:** 1.0  
**Last Updated:** 2024-12-14  
**On-Call Contact:** [Your Team Slack/PagerDuty]

---

## Table of Contents

1. [Service Overview](#service-overview)
2. [Critical Failure Modes](#critical-failure-modes)
3. [Incident Response Procedures](#incident-response-procedures)
4. [Diagnostic Commands](#diagnostic-commands)
5. [Monitoring & Dashboards](#monitoring--dashboards)
6. [Rollback Procedures](#rollback-procedures)
7. [Escalation Paths](#escalation-paths)

---

## Service Overview

### Architecture
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Vercel    │─────▶│   Supabase   │─────▶│ PostgreSQL  │
│  (Frontend) │      │  (Backend)   │      │  (Database) │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       │                     ▼
       │              ┌──────────────┐
       └─────────────▶│  Auth/Storage│
                      └──────────────┘
```

### Critical Dependencies
- **Frontend:** Vercel CDN (React/Vite SPA)
- **Backend:** Supabase (API + Auth + Storage)
- **Database:** PostgreSQL (managed by Supabase)
- **Auth:** Supabase Auth (JWT-based sessions)

### Key Metrics
- **Response Time:** P95 < 500ms
- **Error Rate:** < 1%
- **Availability:** 99.9% uptime SLA
- **Database Connections:** < 80% pool utilization

---

## Critical Failure Modes

### 1. Complete Service Outage

**Symptoms:**
- Users cannot load the application
- All API requests fail with 5xx errors
- Health check endpoints timeout

**Immediate Actions:**
```bash
# 1. Check Vercel deployment status
curl -I https://your-app.vercel.app
# Expected: HTTP/2 200

# 2. Check Supabase status
curl -I https://your-project.supabase.co/rest/v1/
# Expected: HTTP/2 200

# 3. Check Supabase dashboard
open https://supabase.com/dashboard/project/YOUR_PROJECT_ID
```

**Triage Steps:**
1. Verify Vercel deployment status: https://vercel.com/dashboard
2. Check Supabase status page: https://status.supabase.com
3. Review recent deployments in Vercel dashboard
4. Check for ongoing incidents on status pages

**Mitigation:**
```bash
# If Vercel deployment failed, rollback to last known good
vercel rollback

# If Supabase is down, wait for service restoration
# Monitor: https://status.supabase.com

# If database connection pool exhausted
# Check active connections in Supabase dashboard
# Settings > Database > Connection pooling
```

---

### 2. Authentication Failures

**Symptoms:**
- Users cannot sign in/sign up
- "Missing Supabase environment variables" errors
- Session tokens expire immediately
- Infinite redirect loops

**Immediate Actions:**
```bash
# 1. Verify environment variables in Vercel
vercel env ls

# 2. Check Supabase project status
curl https://YOUR_PROJECT.supabase.co/auth/v1/health
# Expected: {"status":"ok"}

# 3. Test authentication endpoint
curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/token \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Triage Steps:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. Check Supabase Auth settings: Dashboard > Authentication > Settings
3. Review auth logs: Dashboard > Logs > Auth Logs
4. Verify JWT secret hasn't been rotated

**Mitigation:**
```bash
# If environment variables missing
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Redeploy to apply changes
vercel --prod

# If JWT secret rotated, update in Vercel
# Get new keys from Supabase Dashboard > Settings > API
```

**Diagnostic Queries:**
```sql
-- Check recent auth attempts
SELECT 
  created_at,
  email,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Check active sessions
SELECT 
  user_id,
  created_at,
  updated_at,
  expires_at
FROM auth.sessions
WHERE expires_at > now()
ORDER BY updated_at DESC;
```

---

### 3. Database Connection Exhaustion

**Symptoms:**
- "remaining connection slots are reserved" errors
- Queries timeout after 30s
- Intermittent 500 errors
- Slow page loads

**Immediate Actions:**
```bash
# 1. Check connection pool status in Supabase Dashboard
# Settings > Database > Connection pooling

# 2. Check active queries
# Dashboard > Database > Query Performance
```

**Triage Steps:**
1. Navigate to Supabase Dashboard > Database
2. Check "Connection pooling" section
3. Review "Query Performance" for long-running queries
4. Check for connection leaks in application logs

**Mitigation:**
```sql
-- Kill long-running queries (use with caution)
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;

-- Terminate specific query
SELECT pg_terminate_backend(PID_HERE);

-- Check connection count by state
SELECT 
  state,
  count(*) 
FROM pg_stat_activity 
GROUP BY state;
```

**Prevention:**
- Ensure all Supabase client calls have proper error handling
- Implement connection pooling limits
- Add query timeouts
- Monitor connection metrics

---

### 4. RLS Policy Blocking Legitimate Queries

**Symptoms:**
- Users see empty feeds despite data existing
- "permission denied" errors in browser console
- Specific users cannot access their own data
- New features return no results

**Immediate Actions:**
```bash
# 1. Check browser console for RLS errors
# Look for: "new row violates row-level security policy"

# 2. Review recent migrations
ls -lt supabase/migrations/ | head -5

# 3. Check RLS policies in Supabase Dashboard
# Database > Policies
```

**Triage Steps:**
1. Identify affected table from error message
2. Review RLS policies for that table
3. Test query as specific user
4. Check if recent migration changed policies

**Diagnostic Queries:**
```sql
-- List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test query as specific user
SET request.jwt.claims.sub = 'USER_UUID_HERE';
SELECT * FROM posts WHERE author_id = 'USER_UUID_HERE';
RESET request.jwt.claims.sub;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Mitigation:**
```sql
-- Temporarily disable RLS for debugging (NEVER in production)
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Fix policy example: Allow users to view their own posts
DROP POLICY IF EXISTS "Users can view own posts" ON posts;
CREATE POLICY "Users can view own posts"
  ON posts FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

-- Re-enable RLS
-- ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

---

### 5. High Database Load / Slow Queries

**Symptoms:**
- Feed takes >5s to load
- P95 latency spikes
- Database CPU >80%
- Queries timing out

**Immediate Actions:**
```bash
# 1. Check database metrics in Supabase Dashboard
# Database > Query Performance

# 2. Identify slow queries
# Look for queries >1s execution time
```

**Triage Steps:**
1. Navigate to Dashboard > Database > Query Performance
2. Sort by "Total Time" or "Mean Time"
3. Identify queries without proper indexes
4. Check for N+1 query patterns

**Diagnostic Queries:**
```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check missing indexes
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY tablename, attname;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

**Mitigation:**
```sql
-- Add missing indexes (example)
CREATE INDEX CONCURRENTLY idx_posts_created_at_privacy 
  ON posts(created_at DESC, privacy_level) 
  WHERE privacy_level = 'public';

-- Analyze tables to update statistics
ANALYZE posts;
ANALYZE profiles;

-- Vacuum to reclaim space
VACUUM ANALYZE posts;
```

**Application-Level Fixes:**
```typescript
// Add pagination to queries
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 19)  // Limit to 20 results
  .limit(20);

// Use select() to fetch only needed columns
const { data, error } = await supabase
  .from('posts')
  .select('id, content, created_at, author_id')  // Don't fetch all columns
  .eq('privacy_level', 'public');
```

---

### 6. Storage/CDN Issues

**Symptoms:**
- Avatar images not loading
- 404 errors for uploaded files
- Slow image load times
- CORS errors in console

**Immediate Actions:**
```bash
# 1. Check Supabase Storage status
curl -I https://YOUR_PROJECT.supabase.co/storage/v1/
# Expected: HTTP/2 200

# 2. Test specific bucket
curl -I https://YOUR_PROJECT.supabase.co/storage/v1/object/public/avatars/test.jpg

# 3. Check CORS configuration
# Dashboard > Storage > Configuration
```

**Triage Steps:**
1. Verify bucket exists: Dashboard > Storage
2. Check bucket policies: Dashboard > Storage > Policies
3. Verify CORS settings allow your domain
4. Test file upload manually in dashboard

**Mitigation:**
```sql
-- Check storage policies
SELECT 
  name,
  definition
FROM storage.policies
WHERE bucket_id = 'avatars';

-- Create missing policy
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES (
  'Public avatar access',
  'avatars',
  '(bucket_id = ''avatars''::text)'
);
```

**CORS Configuration:**
```json
{
  "allowedOrigins": ["https://your-app.vercel.app"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

---

### 7. Memory Leak / Frontend Performance

**Symptoms:**
- Browser tab becomes unresponsive
- Memory usage grows over time
- React DevTools shows excessive re-renders
- Console warnings about memory

**Immediate Actions:**
```bash
# 1. Check browser console for warnings
# Look for: "Memory leak detected" or excessive re-renders

# 2. Profile with React DevTools
# Install: https://react.dev/learn/react-developer-tools

# 3. Check for subscription leaks
grep -r "supabase.channel\|subscribe" src/ --include="*.tsx"
```

**Triage Steps:**
1. Open React DevTools Profiler
2. Record user interaction
3. Look for components re-rendering unnecessarily
4. Check for unsubscribed Supabase channels

**Common Issues:**
```typescript
// ❌ WRONG - Memory leak (no cleanup)
useEffect(() => {
  const channel = supabase.channel('posts');
  channel.subscribe();
  // Missing cleanup!
}, []);

// ✅ RIGHT - Proper cleanup
useEffect(() => {
  const channel = supabase.channel('posts');
  channel.subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, []);

// ❌ WRONG - Infinite re-render
const [data, setData] = useState([]);
useEffect(() => {
  fetchData().then(setData);
}, [data]);  // Depends on data it sets!

// ✅ RIGHT - Runs once
const [data, setData] = useState([]);
useEffect(() => {
  fetchData().then(setData);
}, []);  // Empty dependency array
```

**Mitigation:**
```bash
# 1. Deploy hotfix with proper cleanup
git checkout -b hotfix/memory-leak
# Fix the issue
git commit -m "Fix memory leak in subscription cleanup"
git push origin hotfix/memory-leak

# 2. Deploy to production
vercel --prod

# 3. Monitor memory usage
# Use browser DevTools > Memory > Take heap snapshot
```

---

## Diagnostic Commands

### Frontend Diagnostics

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs YOUR_DEPLOYMENT_URL

# Check environment variables
vercel env ls

# Test production build locally
npm run build && npm run preview

# Check bundle size
npm run build
ls -lh dist/assets/

# Analyze bundle
npx vite-bundle-visualizer
```

### Backend Diagnostics

```bash
# Test Supabase connection
curl https://YOUR_PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Test authentication
curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/token \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Check database health
curl https://YOUR_PROJECT.supabase.co/rest/v1/rpc/health \
  -H "apikey: YOUR_ANON_KEY"
```

### Database Diagnostics

```sql
-- Check database size
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT 
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active,
  count(*) FILTER (WHERE state = 'idle') as idle,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity;

-- Check replication lag (if applicable)
SELECT 
  client_addr,
  state,
  sync_state,
  pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS lag_bytes
FROM pg_stat_replication;

-- Check for locks
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query as blocked_query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;

-- Check cache hit ratio
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

---

## Monitoring & Dashboards

### Supabase Dashboard
**URL:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID

**Key Metrics to Monitor:**
- **Database > Query Performance:** Slow queries, execution times
- **Database > Connection pooling:** Active connections, pool utilization
- **Logs > API Logs:** Request rates, error rates, response times
- **Logs > Auth Logs:** Sign-in attempts, failures
- **Storage > Usage:** Storage consumption, bandwidth

### Vercel Dashboard
**URL:** https://vercel.com/dashboard

**Key Metrics to Monitor:**
- **Deployments:** Build status, deployment frequency
- **Analytics:** Page views, unique visitors, top pages
- **Speed Insights:** Core Web Vitals, LCP, FID, CLS
- **Logs:** Function invocations, errors

### Browser Monitoring (Recommended)

**Setup Sentry (Error Tracking):**
```bash
npm install @sentry/react

# Add to src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

**Setup PostHog (Analytics):**
```bash
npm install posthog-js

# Add to src/main.tsx
import posthog from 'posthog-js';

posthog.init('YOUR_POSTHOG_KEY', {
  api_host: 'https://app.posthog.com'
});
```

### Custom Alerts (Recommended)

**Supabase Alerts:**
- Database CPU > 80% for 5 minutes
- Connection pool > 90% for 2 minutes
- Error rate > 5% for 1 minute
- Query execution time > 5s

**Vercel Alerts:**
- Build failures
- Deployment errors
- Function timeout rate > 1%

---

## Rollback Procedures

### Frontend Rollback

```bash
# 1. List recent deployments
vercel ls

# 2. Identify last known good deployment
# Look for deployment before incident started

# 3. Rollback to specific deployment
vercel rollback YOUR_DEPLOYMENT_URL

# 4. Verify rollback
curl -I https://your-app.vercel.app
# Check version in response headers

# 5. Monitor for 5 minutes
# Check error rates return to normal
```

### Database Rollback

```bash
# 1. Identify problematic migration
ls -lt supabase/migrations/

# 2. Create rollback migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_feature.sql << 'EOF'
-- Rollback: [describe what you're rolling back]

-- Drop new tables
DROP TABLE IF EXISTS new_table CASCADE;

-- Restore old policies
DROP POLICY IF EXISTS "new_policy" ON table_name;
CREATE POLICY "old_policy" ON table_name ...;

-- Restore old columns
ALTER TABLE table_name DROP COLUMN IF EXISTS new_column;
EOF

# 3. Apply rollback migration
# In Supabase Dashboard > SQL Editor
# Copy and execute rollback migration

# 4. Verify rollback
# Test affected queries in SQL Editor

# 5. Regenerate TypeScript types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

### Emergency Database Restore

```bash
# 1. Access Supabase Dashboard > Database > Backups

# 2. Select backup point before incident
# Note: This will restore entire database

# 3. Click "Restore" and confirm
# WARNING: This will overwrite current data

# 4. Wait for restore to complete (5-30 minutes)

# 5. Verify data integrity
# Run smoke tests on critical tables
```

---

## Escalation Paths

### Level 1: On-Call Engineer (You)
**Response Time:** Immediate  
**Responsibilities:**
- Initial triage and diagnosis
- Apply standard mitigation procedures
- Monitor service health
- Document incident timeline

**Escalate if:**
- Issue not resolved in 30 minutes
- Data loss suspected
- Security breach suspected
- Multiple systems affected

### Level 2: Senior Engineer / Team Lead
**Response Time:** 15 minutes  
**Contact:** [Slack channel / Phone]  
**Responsibilities:**
- Complex debugging
- Architecture decisions
- Database schema changes
- Coordinate with external teams

**Escalate if:**
- Issue not resolved in 1 hour
- Requires infrastructure changes
- Affects multiple customers
- Potential data breach

### Level 3: Engineering Manager / CTO
**Response Time:** 30 minutes  
**Contact:** [Phone / Email]  
**Responsibilities:**
- Executive decisions
- Customer communication
- Vendor escalation (Vercel, Supabase)
- Post-incident review

### External Vendors

**Vercel Support:**
- Email: support@vercel.com
- Dashboard: https://vercel.com/support
- Priority: Enterprise customers get 1-hour response

**Supabase Support:**
- Email: support@supabase.com
- Dashboard: https://supabase.com/dashboard/support
- Discord: https://discord.supabase.com
- Priority: Pro/Enterprise get priority support

---

## Post-Incident Checklist

After resolving an incident:

- [ ] Document incident timeline in incident log
- [ ] Update this runbook with new learnings
- [ ] Create post-mortem document (for major incidents)
- [ ] Identify root cause
- [ ] Create follow-up tasks to prevent recurrence
- [ ] Update monitoring/alerting if gaps found
- [ ] Communicate resolution to stakeholders
- [ ] Schedule post-mortem review meeting

**Post-Mortem Template:**
```markdown
# Incident Post-Mortem: [Title]

**Date:** YYYY-MM-DD
**Duration:** X hours
**Severity:** Critical/High/Medium/Low
**Impact:** X users affected

## Timeline
- HH:MM - Incident detected
- HH:MM - Initial triage
- HH:MM - Root cause identified
- HH:MM - Mitigation applied
- HH:MM - Incident resolved

## Root Cause
[Detailed explanation]

## Resolution
[What fixed it]

## Action Items
- [ ] Task 1 (Owner: Name, Due: Date)
- [ ] Task 2 (Owner: Name, Due: Date)

## Lessons Learned
- What went well
- What could be improved
```

---

## Quick Reference

### Emergency Contacts
- **On-Call Slack:** #oncall-engineering
- **Incident Channel:** #incidents
- **Team Lead:** [Name] - [Phone]
- **Manager:** [Name] - [Phone]

### Critical URLs
- **Production:** https://your-app.vercel.app
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID
- **Status Pages:**
  - Vercel: https://www.vercel-status.com
  - Supabase: https://status.supabase.com

### Common Commands
```bash
# Check service health
curl -I https://your-app.vercel.app

# Rollback deployment
vercel rollback

# View logs
vercel logs

# Check environment
vercel env ls

# Deploy hotfix
git push origin hotfix/issue && vercel --prod
```

---

**Remember:** When in doubt, escalate early. It's better to involve senior engineers unnecessarily than to let an incident grow.

**Last Updated:** 2024-12-14  
**Next Review:** 2025-01-14
