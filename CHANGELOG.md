# Changelog

All notable changes to Ripple will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-01

### Added
- User authentication (sign up, sign in, sign out) via Supabase Auth
- Post creation with privacy controls (public, private, recipient-only)
- Public feed with chronological and top stories views
- Tagged posts feed for viewing posts where you are the recipient
- Saved/bookmarked posts feed
- Like and unlike posts
- Bookmark and unbookmark posts
- Comments on posts
- Recipient tagging (registered users and anonymous matching)
- Notification system with polling for likes, comments, and tags
- User profiles with display names and avatars
- User blocking
- Search functionality for finding users
- Input validation and content length limits
- Row Level Security on all database tables
- Error boundary for graceful error handling
- Responsive design with Tailwind CSS
- Production documentation (README, CONTRIBUTING, SECURITY, LICENSE)
- Testing infrastructure with Vitest and Testing Library
- ESLint and Prettier configuration
