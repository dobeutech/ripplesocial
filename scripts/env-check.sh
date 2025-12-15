#!/bin/bash

# Environment Variable Checker
# Validates required environment variables are set

echo "🔍 Checking Environment Variables..."
echo ""

MISSING=0

# Required variables
REQUIRED_VARS=(
  "VITE_SUPABASE_URL"
  "VITE_SUPABASE_ANON_KEY"
)

# Check each required variable
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Missing: $var"
    MISSING=$((MISSING + 1))
  else
    echo "✅ Found: $var"
  fi
done

echo ""

# Optional variables
OPTIONAL_VARS=(
  "VITE_SENTRY_DSN"
  "VITE_POSTHOG_KEY"
)

echo "Optional variables:"
for var in "${OPTIONAL_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "⚠️  Not set: $var"
  else
    echo "✅ Found: $var"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $MISSING -eq 0 ]; then
  echo "✅ All required environment variables are set"
  exit 0
else
  echo "❌ Missing $MISSING required environment variables"
  echo ""
  echo "Copy .env.example to .env.local and fill in the values:"
  echo "  cp .env.example .env.local"
  exit 1
fi
