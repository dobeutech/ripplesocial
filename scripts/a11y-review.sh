#!/bin/bash

# Accessibility Review Script for Ripple
# Checks for common accessibility issues in React components

echo "🔍 Running Accessibility Review..."
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check for missing alt text on images
echo "📸 Checking for images without alt text..."
MISSING_ALT=$(grep -r "<img" src/ --include="*.tsx" --include="*.jsx" | grep -v "alt=" | wc -l)
if [ $MISSING_ALT -gt 0 ]; then
  echo -e "${RED}❌ Found $MISSING_ALT images without alt text${NC}"
  grep -rn "<img" src/ --include="*.tsx" --include="*.jsx" | grep -v "alt="
  ISSUES_FOUND=$((ISSUES_FOUND + MISSING_ALT))
else
  echo -e "${GREEN}✅ All images have alt text${NC}"
fi
echo ""

# Check for buttons without accessible labels
echo "🔘 Checking for buttons without accessible labels..."
UNLABELED_BUTTONS=$(grep -r "<button" src/ --include="*.tsx" --include="*.jsx" | grep -v "aria-label=" | grep -v ">" | wc -l)
if [ $UNLABELED_BUTTONS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $UNLABELED_BUTTONS buttons that may need aria-label${NC}"
  echo "   (Review manually - buttons with text content are OK)"
else
  echo -e "${GREEN}✅ Button labels look good${NC}"
fi
echo ""

# Check for form inputs without labels
echo "📝 Checking for form inputs without labels..."
UNLABELED_INPUTS=$(grep -r "<input" src/ --include="*.tsx" --include="*.jsx" | grep -v "aria-label=" | grep -v "id=" | wc -l)
if [ $UNLABELED_INPUTS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $UNLABELED_INPUTS inputs that may need labels${NC}"
  echo "   (Ensure each input has a <label> or aria-label)"
else
  echo -e "${GREEN}✅ Input labels look good${NC}"
fi
echo ""

# Check for missing ARIA roles on interactive elements
echo "🎭 Checking for ARIA roles..."
MISSING_ROLES=$(grep -r "onClick=" src/ --include="*.tsx" --include="*.jsx" | grep -v "<button" | grep -v "role=" | wc -l)
if [ $MISSING_ROLES -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $MISSING_ROLES clickable elements without button tag or role${NC}"
  echo "   (Non-button clickable elements should have role='button')"
else
  echo -e "${GREEN}✅ ARIA roles look good${NC}"
fi
echo ""

# Check for missing keyboard navigation
echo "⌨️  Checking for keyboard navigation..."
MISSING_TABINDEX=$(grep -r "onClick=" src/ --include="*.tsx" --include="*.jsx" | grep -v "<button" | grep -v "tabIndex=" | wc -l)
if [ $MISSING_TABINDEX -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $MISSING_TABINDEX clickable elements without tabIndex${NC}"
  echo "   (Non-button clickable elements should be keyboard accessible)"
else
  echo -e "${GREEN}✅ Keyboard navigation looks good${NC}"
fi
echo ""

# Check for color contrast issues (basic check)
echo "🎨 Checking for potential color contrast issues..."
LOW_CONTRAST=$(grep -r "text-gray-400\|text-gray-300" src/ --include="*.tsx" --include="*.jsx" | wc -l)
if [ $LOW_CONTRAST -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $LOW_CONTRAST instances of light gray text${NC}"
  echo "   (Verify color contrast ratio is at least 4.5:1)"
else
  echo -e "${GREEN}✅ No obvious contrast issues${NC}"
fi
echo ""

# Check for semantic HTML
echo "📄 Checking for semantic HTML..."
DIV_BUTTONS=$(grep -r "<div.*onClick" src/ --include="*.tsx" --include="*.jsx" | wc -l)
if [ $DIV_BUTTONS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $DIV_BUTTONS divs with onClick handlers${NC}"
  echo "   (Consider using <button> instead for better accessibility)"
  grep -rn "<div.*onClick" src/ --include="*.tsx" --include="*.jsx"
else
  echo -e "${GREEN}✅ Semantic HTML looks good${NC}"
fi
echo ""

# Check for heading hierarchy
echo "📑 Checking heading hierarchy..."
H1_COUNT=$(grep -r "<h1" src/ --include="*.tsx" --include="*.jsx" | wc -l)
if [ $H1_COUNT -eq 0 ]; then
  echo -e "${RED}❌ No <h1> headings found${NC}"
  echo "   (Each page should have exactly one <h1>)"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
elif [ $H1_COUNT -gt 5 ]; then
  echo -e "${YELLOW}⚠️  Found $H1_COUNT <h1> headings${NC}"
  echo "   (Each page should have exactly one <h1>)"
else
  echo -e "${GREEN}✅ Heading structure looks good${NC}"
fi
echo ""

# Check for focus indicators
echo "🎯 Checking for focus indicators..."
FOCUS_STYLES=$(grep -r "focus:" src/ --include="*.tsx" --include="*.jsx" --include="*.css" | wc -l)
if [ $FOCUS_STYLES -lt 5 ]; then
  echo -e "${YELLOW}⚠️  Found only $FOCUS_STYLES focus styles${NC}"
  echo "   (Ensure all interactive elements have visible focus indicators)"
else
  echo -e "${GREEN}✅ Focus indicators present${NC}"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ Accessibility review complete - No critical issues found${NC}"
  echo ""
  echo "Note: This is a basic automated check. For comprehensive accessibility:"
  echo "  1. Test with screen readers (NVDA, JAWS, VoiceOver)"
  echo "  2. Test keyboard-only navigation"
  echo "  3. Use axe DevTools browser extension"
  echo "  4. Run Lighthouse accessibility audit"
  exit 0
else
  echo -e "${RED}❌ Found $ISSUES_FOUND critical accessibility issues${NC}"
  echo ""
  echo "Please fix these issues before deploying to production."
  echo ""
  echo "Resources:"
  echo "  - WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref/"
  echo "  - React Accessibility: https://react.dev/learn/accessibility"
  echo "  - axe DevTools: https://www.deque.com/axe/devtools/"
  exit 1
fi
