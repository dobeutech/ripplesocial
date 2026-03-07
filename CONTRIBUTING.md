# Contributing to Ripple

Thank you for your interest in contributing to Ripple! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
5. Start the dev server: `npm run dev`

## Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes
3. Run all checks before committing:
   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   npm run test
   ```
4. Commit your changes with a descriptive message (see below)
5. Push to your fork and open a Pull Request

## Commit Message Format

Use conventional commit messages:

```
<type>: <short description>

<optional body with more detail>
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `refactor` - Code refactoring (no feature change)
- `test` - Adding or updating tests
- `chore` - Maintenance tasks (dependencies, configs)
- `style` - Code style/formatting changes

Examples:
```
feat: add bookmark button to post cards
fix: prevent duplicate likes on rapid clicks
docs: update README with Supabase setup instructions
test: add unit tests for auth modal validation
```

## Code Style

- TypeScript is required for all source files
- Follow existing code patterns and conventions
- Use functional React components with hooks
- Run `npm run format` to auto-format with Prettier
- Run `npm run lint` to check for linting issues

## Pull Request Guidelines

- Keep PRs focused on a single change
- Include a clear description of what changed and why
- Ensure all CI checks pass (typecheck, lint, tests, build)
- Update documentation if your change affects usage or setup
- Add tests for new functionality where practical

## Database Changes

If your contribution requires database schema changes:

1. Create a new migration file in `supabase/migrations/` with a timestamp prefix
2. Include both the migration SQL and any necessary RLS policies
3. Document the schema change in your PR description
4. Test the migration against a fresh Supabase project

## Reporting Issues

- Use GitHub Issues to report bugs or suggest features
- Include steps to reproduce for bug reports
- Include browser and OS information for UI issues

## Security

If you discover a security vulnerability, do **not** open a public issue. Instead, follow the process described in [SECURITY.md](./SECURITY.md).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
