# Ripple Production Deployment Plan

**Date:** 2024-12-14
**Status:** Draft
**Target:** Production-ready deployment

---

## Executive Summary

Ripple is a React/TypeScript social media platform using Supabase as its backend. The codebase has a solid foundation with modern practices and recent security fixes. However, several critical gaps must be addressed before production deployment.

**Current State:** Staging-ready with B+ quality
**Production Readiness:** 60-70%
**Estimated Work Remaining:** 4-6 weeks (depending on team size)

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Production Requirements Checklist](#2-production-requirements-checklist)
3. [Phase 1: Testing Infrastructure](#phase-1-testing-infrastructure-week-1-2)
4. [Phase 2: Security Hardening](#phase-2-security-hardening-week-2-3)
5. [Phase 3: Infrastructure & DevOps](#phase-3-infrastructure--devops-week-3-4)
6. [Phase 4: Performance & Optimization](#phase-4-performance--optimization-week-4-5)
7. [Phase 5: Pre-Launch Checklist](#phase-5-pre-launch-checklist-week-5-6)
8. [Feature Completion Status](#feature-completion-status)
9. [Risk Assessment](#risk-assessment)
10. [Resource Requirements](#resource-requirements)

---

## 1. Current State Assessment

### What's Working ✅

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Complete | Sign up, sign in, sessions, logout |
| Post Creation | ✅ Complete | Content, recipients, privacy levels |
| Feed Display | ✅ Complete | 3 modes: public, top stories, tagged |
| Like System | ✅ Complete | Toggle, counts, notifications |
| Notifications | ✅ Complete | Panel, types, unread tracking |
| Database Schema | ✅ Complete | 8 tables, RLS, triggers |
| Error Handling | ✅ Complete | Error boundary, try-catch |
| Security Fixes | ✅ Complete | SQL injection, RLS policies fixed |

### What's Missing ❌

| Feature | Status | Priority |
|---------|--------|----------|
| Testing Suite | ❌ None | Critical |
| CI/CD Pipeline | ❌ None | Critical |
| Rate Limiting | ❌ None | High |
| Comments UI | ⚠️ DB only | Medium |
| Pagination | ❌ Hardcoded limits | Medium |
| Real-time Updates | ❌ Polling only | Low |
| Profile Pages | ❌ None | Low |

---

## 2. Production Requirements Checklist

### Critical (Must Have) ☐

- [ ] **Testing**: Unit tests with 70%+ coverage
- [ ] **Testing**: Integration tests for auth flows
- [ ] **Testing**: E2E tests for critical paths
- [ ] **Security**: Rate limiting on all endpoints
- [ ] **Security**: Input validation & sanitization
- [ ] **Security**: Security audit (internal or external)
- [ ] **Infrastructure**: CI/CD pipeline
- [ ] **Infrastructure**: Staging environment
- [ ] **Infrastructure**: Production environment
- [ ] **Monitoring**: Error tracking (Sentry)
- [ ] **Monitoring**: Basic logging
- [ ] **Documentation**: Environment setup guide
- [ ] **Documentation**: Deployment runbook

### Important (Should Have) ☐

- [ ] **Performance**: Pagination/infinite scroll
- [ ] **Performance**: Database query optimization
- [ ] **Performance**: Image lazy loading
- [ ] **Security**: Password strength requirements
- [ ] **Security**: Email verification
- [ ] **UX**: Loading skeletons
- [ ] **Documentation**: API documentation

### Nice to Have ☐

- [ ] **Performance**: Real-time subscriptions
- [ ] **Performance**: CDN for static assets
- [ ] **Features**: Comments implementation
- [ ] **Features**: Profile pages
- [ ] **Monitoring**: Performance monitoring (APM)
- [ ] **Security**: 2FA support

---

## Phase 1: Testing Infrastructure (Week 1-2)

### Goals
- Set up testing framework
- Write tests for critical paths
- Achieve 70% code coverage on core features

### Tasks

#### 1.1 Testing Framework Setup
```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom @vitest/coverage-v8 msw
```

**Files to create:**
- `vitest.config.ts` - Test configuration
- `src/test/setup.ts` - Test setup with mocks
- `src/test/mocks/supabase.ts` - Supabase client mock

#### 1.2 Unit Tests (Priority Order)

| Component | Priority | Tests Needed |
|-----------|----------|--------------|
| `auth-context.tsx` | 🔴 Critical | signIn, signUp, signOut, session handling |
| `supabase.ts` | 🔴 Critical | Client initialization, env validation |
| `create-post-modal.tsx` | 🔴 Critical | Form submission, recipient search, validation |
| `feed.tsx` | 🟡 High | Feed modes, data fetching, like status |
| `post-card.tsx` | 🟡 High | Rendering, like toggle, time display |
| `notification-panel.tsx` | 🟢 Medium | Display, mark as read |
| UI components | 🟢 Medium | Button, Input, Modal, etc. |

#### 1.3 Integration Tests

| Flow | Tests Needed |
|------|--------------|
| Auth | Sign up → Profile creation → Pending matches |
| Post | Create → Display in feed → Like → Notification |
| Feed | Mode switching, filtering, refresh |

#### 1.4 E2E Tests (Playwright/Cypress)

| User Journey | Priority |
|--------------|----------|
| New user signup and first post | 🔴 Critical |
| Existing user login and feed browse | 🔴 Critical |
| Post creation with recipient tagging | 🟡 High |
| Notification interaction | 🟢 Medium |

### Deliverables
- [ ] Vitest configured and running
- [ ] 70%+ coverage on `contexts/` and `lib/`
- [ ] 50%+ coverage on `components/`
- [ ] CI-compatible test command
- [ ] Test coverage report generation

---

## Phase 2: Security Hardening (Week 2-3)

### Goals
- Implement rate limiting
- Add input validation
- Complete security audit

### Tasks

#### 2.1 Rate Limiting

**Option A: Supabase Edge Functions** (Recommended)
```typescript
// Edge function with rate limiting
import { createClient } from '@supabase/supabase-js';

const RATE_LIMITS = {
  posts: { max: 10, window: '1h' },
  likes: { max: 100, window: '1h' },
  search: { max: 50, window: '1m' }
};
```

**Option B: Application-Level**
```bash
npm install rate-limiter-flexible
```

**Endpoints to rate limit:**
| Action | Limit | Window |
|--------|-------|--------|
| Post creation | 10 | 1 hour |
| Like/unlike | 100 | 1 hour |
| User search | 50 | 1 minute |
| Login attempts | 5 | 15 minutes |

#### 2.2 Input Validation

**Install Zod for validation:**
```bash
npm install zod
```

**Validation schemas needed:**
```typescript
// src/lib/validation.ts
import { z } from 'zod';

export const PostSchema = z.object({
  content: z.string().min(1).max(5000),
  privacy_level: z.enum(['public', 'private', 'recipient_only']),
  poster_anonymity: z.enum(['full_profile', 'first_name_only']),
  recipient_name: z.string().max(100).optional(),
});

export const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50).optional(),
});
```

#### 2.3 Security Audit Checklist

| Item | Status | Action |
|------|--------|--------|
| SQL Injection | ✅ Fixed | Verified |
| XSS Prevention | ⚠️ Check | React escapes by default, verify no dangerouslySetInnerHTML |
| CSRF | ⚠️ Review | Supabase handles via tokens |
| Auth Security | ⚠️ Review | Add password strength, rate limiting |
| RLS Policies | ✅ Fixed | Verified in migration |
| Sensitive Data | ⚠️ Check | Ensure no secrets in client bundle |
| CORS | ⚠️ Check | Review Supabase CORS settings |
| HTTPS | ☐ Required | Enforce in production |

### Deliverables
- [ ] Rate limiting implemented and tested
- [ ] Input validation with Zod
- [ ] Security audit completed
- [ ] Penetration test (if budget allows)
- [ ] Security documentation

---

## Phase 3: Infrastructure & DevOps (Week 3-4)

### Goals
- Set up CI/CD pipeline
- Configure staging and production environments
- Implement monitoring

### Tasks

#### 3.1 CI/CD Pipeline (GitHub Actions)

**Create `.github/workflows/ci.yml`:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

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
      - run: npm run test -- --coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      # Deploy to staging (Vercel, Netlify, etc.)

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      # Deploy to production
```

#### 3.2 Environment Configuration

**Create `.env.example`:**
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Analytics
VITE_SENTRY_DSN=your-sentry-dsn

# Feature Flags (optional)
VITE_ENABLE_COMMENTS=false
```

**Environment Matrix:**
| Variable | Staging | Production |
|----------|---------|------------|
| SUPABASE_URL | staging-project | prod-project |
| SUPABASE_ANON_KEY | staging-key | prod-key |
| SENTRY_DSN | staging-dsn | prod-dsn |

#### 3.3 Monitoring Setup

**Error Tracking (Sentry):**
```bash
npm install @sentry/react
```

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

**Integrate with Error Boundary:**
```typescript
// In ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, { extra: errorInfo });
}
```

#### 3.4 Hosting Options

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Vercel** | Easy, fast, preview deploys | Lock-in | Free-$20/mo |
| **Netlify** | Easy, good DX | Similar limits | Free-$19/mo |
| **Cloudflare Pages** | Fast CDN, cheap | Newer platform | Free-$5/mo |
| **AWS S3 + CloudFront** | Full control | Complex setup | ~$5-20/mo |

**Recommended:** Vercel or Netlify for simplicity

### Deliverables
- [ ] GitHub Actions CI/CD configured
- [ ] Staging environment deployed
- [ ] Production environment configured
- [ ] Sentry error tracking live
- [ ] Environment documentation complete

---

## Phase 4: Performance & Optimization (Week 4-5)

### Goals
- Implement pagination
- Optimize bundle size
- Improve user experience

### Tasks

#### 4.1 Pagination Implementation

**Infinite Scroll for Feed:**
```typescript
// src/hooks/useInfiniteScroll.ts
export const useInfiniteScroll = (loadMore: () => void) => {
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  }, [loadMore]);

  return { lastElementRef };
};
```

**Update Feed Component:**
```typescript
// Cursor-based pagination
const loadMorePosts = async () => {
  const lastPost = posts[posts.length - 1];
  const { data } = await supabase
    .from('posts')
    .select('*')
    .lt('created_at', lastPost.created_at)
    .order('created_at', { ascending: false })
    .limit(20);

  setPosts(prev => [...prev, ...data]);
};
```

#### 4.2 Bundle Optimization

**Code Splitting:**
```typescript
// Lazy load heavy components
const CreatePostModal = lazy(() => import('./components/posts/create-post-modal'));
const NotificationPanel = lazy(() => import('./components/notifications/notification-panel'));

// Usage
<Suspense fallback={<LoadingSpinner />}>
  <CreatePostModal />
</Suspense>
```

**Analyze Bundle:**
```bash
npm install -D rollup-plugin-visualizer

# In vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ open: true })
]
```

#### 4.3 Optimistic Updates

**Like Toggle with Optimistic UI:**
```typescript
const handleLikeToggle = async () => {
  // Optimistic update
  const wasLiked = post.is_liked;
  setPosts(prev => prev.map(p =>
    p.id === post.id
      ? { ...p, is_liked: !wasLiked, like_count: wasLiked ? p.like_count - 1 : p.like_count + 1 }
      : p
  ));

  try {
    await supabase.from('post_likes')
      [wasLiked ? 'delete' : 'insert']({ post_id: post.id, user_id });
  } catch {
    // Revert on error
    setPosts(prev => prev.map(p =>
      p.id === post.id
        ? { ...p, is_liked: wasLiked, like_count: wasLiked ? p.like_count : p.like_count - 1 }
        : p
    ));
  }
};
```

#### 4.4 Image Optimization

```typescript
// Lazy load images
<img
  src={avatarUrl}
  loading="lazy"
  decoding="async"
  alt={displayName}
/>
```

### Deliverables
- [ ] Infinite scroll implemented
- [ ] Bundle size < 200KB gzipped
- [ ] Optimistic updates for likes
- [ ] Image lazy loading
- [ ] Lighthouse score > 90

---

## Phase 5: Pre-Launch Checklist (Week 5-6)

### Final Verification

#### Security ☐
- [ ] All environment variables secured
- [ ] No secrets in client bundle (check build output)
- [ ] HTTPS enforced
- [ ] Rate limiting active and tested
- [ ] RLS policies verified in production DB
- [ ] Security headers configured (CSP, etc.)

#### Testing ☐
- [ ] All tests passing in CI
- [ ] E2E tests pass against staging
- [ ] Manual QA completed
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile testing (iOS, Android)

#### Performance ☐
- [ ] Lighthouse audit > 90 performance
- [ ] Core Web Vitals passing
- [ ] No console errors
- [ ] Error tracking working

#### Documentation ☐
- [ ] README updated with setup instructions
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Support/contact information added

#### Legal & Compliance ☐
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Cookie consent (if applicable)
- [ ] GDPR compliance (if EU users)

#### Monitoring & Alerting ☐
- [ ] Error alerting configured
- [ ] Uptime monitoring active
- [ ] Database monitoring (Supabase dashboard)
- [ ] On-call schedule defined

### Launch Day Checklist

1. **Pre-Launch (Morning)**
   - [ ] Final staging verification
   - [ ] Team standup and go/no-go decision
   - [ ] Verify all environment variables
   - [ ] Check Supabase quotas and limits

2. **Deploy (Midday)**
   - [ ] Merge to production branch
   - [ ] Monitor CI/CD pipeline
   - [ ] Verify deployment completed
   - [ ] Smoke test critical paths

3. **Post-Deploy (Afternoon)**
   - [ ] Monitor error rates
   - [ ] Check performance metrics
   - [ ] Review Sentry for issues
   - [ ] Team available for hot fixes

4. **Day 1 Monitoring**
   - [ ] Check overnight error rates
   - [ ] Review user feedback
   - [ ] Monitor database performance
   - [ ] Assess scaling needs

---

## Feature Completion Status

### Core Features

| Feature | Completion | Production Ready |
|---------|------------|------------------|
| User Authentication | 100% | ⚠️ Add password strength |
| Post Creation | 100% | ✅ Yes |
| Feed (3 modes) | 100% | ⚠️ Add pagination |
| Like System | 100% | ⚠️ Add optimistic updates |
| Notifications | 90% | ⚠️ Replace polling |
| Error Handling | 100% | ✅ Yes |

### Planned Features (Post-Launch)

| Feature | Priority | Effort |
|---------|----------|--------|
| Comments | High | 2-3 days |
| Profile Pages | High | 3-5 days |
| Real-time Updates | Medium | 2-3 days |
| User Search | Medium | 1-2 days |
| Email Verification | Low | 1-2 days |
| 2FA | Low | 2-3 days |

---

## Risk Assessment

### High Risk 🔴

| Risk | Impact | Mitigation |
|------|--------|------------|
| No tests | Regressions | Phase 1 - testing suite |
| No rate limiting | Abuse/DoS | Phase 2 - rate limiting |
| No monitoring | Blind to issues | Phase 3 - Sentry setup |

### Medium Risk 🟡

| Risk | Impact | Mitigation |
|------|--------|------------|
| Polling notifications | Server load | Plan for real-time upgrade |
| No pagination | Poor UX at scale | Phase 4 - infinite scroll |
| Single developer | Bus factor | Documentation |

### Low Risk 🟢

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing features | User complaints | Post-launch roadmap |
| Performance | Slow experience | CDN, optimization |

---

## Resource Requirements

### Team

| Role | Allocation | Duration |
|------|------------|----------|
| Frontend Developer | 100% | 6 weeks |
| DevOps/SRE | 25% | 2 weeks |
| QA (manual) | 25% | 2 weeks |
| Security Review | 10% | 1 week |

### Tools & Services (Monthly Cost)

| Service | Purpose | Cost |
|---------|---------|------|
| Supabase | Database, Auth | Free tier / $25 |
| Vercel/Netlify | Hosting | Free tier / $20 |
| Sentry | Error tracking | Free tier / $26 |
| GitHub | Code, CI/CD | Free |
| **Total** | | **$0-71/month** |

### Supabase Limits (Free Tier)

- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- 50,000 monthly active users
- 500 Edge Function invocations/day

**Scale Plan ($25/mo) adds:**
- 8 GB database
- 100 GB file storage
- 50 GB bandwidth
- Unlimited Edge Functions

---

## Summary

### Action Items (Immediate)

1. **Today**: Set up Vitest and write first auth tests
2. **This Week**: Complete Phase 1 (testing infrastructure)
3. **Week 2**: Begin Phase 2 (security hardening)
4. **Week 3-4**: Infrastructure and CI/CD
5. **Week 5-6**: Performance, QA, and launch prep

### Key Success Metrics

- [ ] Test coverage > 70%
- [ ] Zero critical security findings
- [ ] CI/CD pipeline < 10 min
- [ ] Lighthouse performance > 90
- [ ] Error rate < 0.1%
- [ ] Time to first byte < 200ms

### Go/No-Go Criteria

**Must be YES for production launch:**
- [ ] All critical tests passing
- [ ] Security audit completed with no high/critical findings
- [ ] Monitoring and alerting active
- [ ] Rollback procedure tested
- [ ] Documentation complete
- [ ] Team on-call schedule defined

---

**Document Author:** Claude
**Last Updated:** 2024-12-14
**Version:** 1.0
