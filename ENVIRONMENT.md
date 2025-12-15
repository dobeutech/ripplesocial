# Development Environment

Documentation for the Ripple development environment setup.

---

## Current Environment

**Status:** ✅ Consolidated to single environment  
**Platform:** Gitpod  
**Last Updated:** 2024-12-14

### Active Environment

```
Environment ID: 019b1c6c-39ee-7563-9e8d-73b1456b6e31
Repository:     https://github.com/dobeutech/ripplesocial.git
Branch:         main
Status:         Running
Machine Class:  019aa7dc-4ea1-7bfc-b8db-64373c367598
```

### Configuration

**Dev Container:**
- Base Image: Ubuntu 24.04
- Configuration: `.devcontainer/devcontainer.json`
- Dockerfile: `.devcontainer/Dockerfile`

**Ports:**
- 50432: VS Code Server
- 61000: Ona SWE Agent

**Secrets:**
- GITHUB_AUTH_TOKEN
- ENVIRONMENT_TOKEN
- SCM_TOKEN

---

## Environment Management

### Listing Environments

```bash
# List all active environments
gitpod environment list

# List all environments (including stopped)
gitpod environment list --all

# Get detailed JSON output
gitpod environment list --format json
```

### Starting/Stopping

```bash
# Stop environment
gitpod environment stop ENVIRONMENT_ID

# Start environment
gitpod environment start ENVIRONMENT_ID

# Delete environment
gitpod environment delete ENVIRONMENT_ID
```

### Current Status

```bash
# Check current environment
gitpod environment list

# Expected output:
# ID                                   REPOSITORY                                    BRANCH CLASS                                PHASE   
# 019b1c6c-39ee-7563-9e8d-73b1456b6e31 https://github.com/dobeutech/ripplesocial.git main   019aa7dc-4ea1-7bfc-b8db-64373c367598 running
```

---

## Dev Container Configuration

### Current Setup

**File:** `.devcontainer/devcontainer.json`

```json
{
  "name": "Ona",
  "build": {
    "context": ".",
    "dockerfile": "Dockerfile"
  }
}
```

**File:** `.devcontainer/Dockerfile`

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# Add custom tools here if needed
```

### Customization

To add tools to the environment:

1. Edit `.devcontainer/Dockerfile`:
   ```dockerfile
   FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04
   
   RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
       && apt-get -y install --no-install-recommends \
       postgresql-client \
       redis-tools
   ```

2. Rebuild the container:
   ```bash
   # In Gitpod, the container will rebuild automatically
   # Or manually trigger rebuild
   ```

---

## Environment Variables

### Required Variables

Create `.env.local` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables

```bash
# Monitoring
VITE_SENTRY_DSN=your-sentry-dsn
VITE_POSTHOG_KEY=your-posthog-key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

### Checking Variables

```bash
# Run environment check script
./scripts/env-check.sh
```

---

## Port Management

### Exposed Ports

| Port | Service | Access |
|------|---------|--------|
| 5173 | Vite Dev Server | Public |
| 50432 | VS Code Server | Public |
| 61000 | Ona SWE Agent | Public |

### Opening Ports

```bash
# Open a port
gitpod environment port open ENVIRONMENT_ID --port 3000

# Close a port
gitpod environment port close ENVIRONMENT_ID --port 3000

# List ports
gitpod environment port list ENVIRONMENT_ID
```

### Accessing Services

When running `npm run dev`, the service will be available at:
```
https://5173--ENVIRONMENT_ID.us-east-1-01.gitpod.dev
```

Use `exec_preview` command with Ona Agent for automatic URL generation.

---

## Secrets Management

### Current Secrets

1. **GITHUB_AUTH_TOKEN** - GitHub authentication
2. **ENVIRONMENT_TOKEN** - Gitpod environment token
3. **SCM_TOKEN** - Source control management token

### Adding Secrets

Secrets are managed at the organization level in Gitpod.

**Via Gitpod Dashboard:**
1. Go to Organization Settings
2. Navigate to Secrets
3. Add new secret
4. Assign to project

**Via CLI:**
```bash
# Secrets are managed through the Gitpod dashboard
# CLI support for secrets is limited
```

---

## Workspace Persistence

### What's Persisted

- ✅ Git repository and changes
- ✅ Installed npm packages (node_modules)
- ✅ Environment variables in .env.local
- ✅ VS Code settings and extensions

### What's Not Persisted

- ❌ Running processes (restart on reconnect)
- ❌ Temporary files in /tmp
- ❌ System-level changes outside workspace

### Backup Strategy

```bash
# Commit changes regularly
git add .
git commit -m "Save work in progress"
git push origin branch-name

# Export environment variables
cat .env.local > .env.backup

# Document any system changes
echo "apt-get install package-name" >> .devcontainer/Dockerfile
```

---

## Troubleshooting

### Environment Won't Start

```bash
# Check environment status
gitpod environment list

# View logs
# Access via: https://22999--ENVIRONMENT_ID.us-east-1-01.gitpod.dev/logs

# Delete and recreate if needed
gitpod environment delete ENVIRONMENT_ID
# Then create new environment from repository
```

### Dev Container Issues

```bash
# Validate devcontainer configuration
gitpod environment devcontainer validate

# Check container status
docker ps

# View container logs
docker logs CONTAINER_ID
```

### Port Not Accessible

```bash
# Check if port is open
gitpod environment port list ENVIRONMENT_ID

# Open port if needed
gitpod environment port open ENVIRONMENT_ID --port 5173

# Check if service is running
lsof -i :5173
```

### Secrets Not Available

```bash
# Check if secrets are mounted
ls -la /usr/local/secrets/

# Verify secret configuration
gitpod environment list --format json | jq '.[] | .spec.secrets'
```

---

## Best Practices

### 1. Regular Commits

Commit your work frequently to avoid losing changes:

```bash
# Every hour or after significant changes
git add .
git commit -m "WIP: description of changes"
git push origin branch-name
```

### 2. Environment Variables

Never commit secrets to the repository:

```bash
# Always use .env.local (gitignored)
echo "VITE_SUPABASE_URL=..." > .env.local

# Use .env.example for documentation
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env.example
git add .env.example
```

### 3. Clean Workspace

Keep your workspace clean:

```bash
# Remove node_modules if needed
rm -rf node_modules
npm install

# Clean build artifacts
rm -rf dist
npm run build
```

### 4. Resource Management

Be mindful of resource usage:

```bash
# Stop environment when not in use
gitpod environment stop ENVIRONMENT_ID

# Monitor resource usage
htop
df -h
```

---

## Migration from Multiple Environments

### Previous State

Multiple environments were consolidated into one on 2024-12-14.

### Current State

✅ **Single consolidated environment**
- All work now happens in one environment
- Cleaner resource management
- Easier to maintain
- Lower costs

### Benefits

1. **Simplified Management** - One environment to track
2. **Cost Efficiency** - No duplicate resources
3. **Consistency** - Same configuration everywhere
4. **Easier Collaboration** - Single source of truth

---

## Environment URLs

### Current Environment

```
Environment ID: 019b1c6c-39ee-7563-9e8d-73b1456b6e31
Base URL:       https://019b1c6c-39ee-7563-9e8d-73b1456b6e31.us-east-1-01.gitpod.dev
```

### Service URLs

```
Logs:           https://22999--019b1c6c-39ee-7563-9e8d-73b1456b6e31.us-east-1-01.gitpod.dev/logs
VS Code:        https://50432--019b1c6c-39ee-7563-9e8d-73b1456b6e31.us-east-1-01.gitpod.dev
Ona Agent:      https://61000--019b1c6c-39ee-7563-9e8d-73b1456b6e31.us-east-1-01.gitpod.dev
Dev Server:     https://5173--019b1c6c-39ee-7563-9e8d-73b1456b6e31.us-east-1-01.gitpod.dev
```

---

## Quick Reference

### Daily Workflow

```bash
# 1. Start working
cd /workspaces/ripple
git pull origin main

# 2. Check environment
./scripts/env-check.sh

# 3. Start development
npm run dev

# 4. Make changes
# ... edit files ...

# 5. Test changes
npm run typecheck
npm run lint

# 6. Commit work
git add .
git commit -m "Description of changes

Co-authored-by: Ona <no-reply@ona.com>"
git push origin branch-name
```

### Common Commands

```bash
# Environment
gitpod environment list
gitpod environment stop ENVIRONMENT_ID
gitpod environment start ENVIRONMENT_ID

# Development
npm run dev
npm run build
npm run typecheck
npm run lint

# Git
git status
git diff
git log --oneline -5

# Scripts
./scripts/env-check.sh
./scripts/a11y-review.sh
./scripts/deps-audit.sh
```

---

## Support

### Issues

If you encounter environment issues:

1. Check this documentation
2. Review [RUNBOOK.md](./RUNBOOK.md) for troubleshooting
3. Check Gitpod status: https://www.gitpod-status.com
4. Contact team lead

### Resources

- [Gitpod Documentation](https://www.gitpod.io/docs)
- [Dev Containers Specification](https://containers.dev)
- [Project Documentation](./DOCUMENTATION_INDEX.md)

---

**Last Updated:** 2024-12-14  
**Environment Status:** ✅ Consolidated and Running  
**Next Review:** As needed
