#!/bin/bash

# Dependency Audit Script
# Checks for outdated and vulnerable dependencies

echo "🔍 Auditing Dependencies..."
echo ""

# Check for security vulnerabilities
echo "🔒 Checking for security vulnerabilities..."
npm audit --production

AUDIT_EXIT=$?
echo ""

# Check for outdated packages
echo "📦 Checking for outdated packages..."
npm outdated

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $AUDIT_EXIT -eq 0 ]; then
  echo "✅ No security vulnerabilities found"
else
  echo "❌ Security vulnerabilities detected"
  echo ""
  echo "Run 'npm audit fix' to fix automatically"
  echo "Or 'npm audit fix --force' for breaking changes"
fi

echo ""
echo "To update dependencies:"
echo "  npm update              # Update minor/patch versions"
echo "  npm install pkg@latest  # Update specific package"
