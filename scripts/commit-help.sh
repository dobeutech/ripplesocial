#!/bin/bash

# Commit Message Helper
# Guides users to write good commit messages

echo "📝 Commit Message Helper"
echo ""
echo "Format: <type>: <description>"
echo ""
echo "Types:"
echo "  feat     - New feature"
echo "  fix      - Bug fix"
echo "  docs     - Documentation changes"
echo "  style    - Code style changes (formatting, etc.)"
echo "  refactor - Code refactoring"
echo "  test     - Adding or updating tests"
echo "  chore    - Maintenance tasks"
echo ""
echo "Example:"
echo "  feat: Add user profile page"
echo ""
echo "  - Display user information"
echo "  - Show user's posts"
echo "  - Add follow button"
echo ""
echo "  Co-authored-by: Ona <no-reply@ona.com>"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prompt for commit type
echo "Select commit type:"
select type in "feat" "fix" "docs" "style" "refactor" "test" "chore"; do
  break
done

# Prompt for description
echo ""
read -p "Enter short description: " description

# Prompt for body
echo ""
echo "Enter detailed description (press Ctrl+D when done):"
body=$(cat)

# Generate commit message
message="$type: $description

$body

Co-authored-by: Ona <no-reply@ona.com>"

echo ""
echo "Generated commit message:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$message"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Commit with this message? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  git commit -m "$message"
  echo "✅ Committed successfully"
else
  echo "❌ Commit cancelled"
fi
