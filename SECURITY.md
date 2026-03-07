# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability in Ripple, please report it responsibly.

**Contact:** [jeremyw@dobeu.net](mailto:jeremyw@dobeu.net)

Please include the following in your report:

- A description of the vulnerability
- Steps to reproduce the issue
- Any potential impact
- Suggested fix (if applicable)

We will acknowledge your report within 48 hours and aim to provide a resolution timeline within 5 business days.

## Security Measures

### Authentication & Authorization
- Authentication is handled entirely by Supabase Auth with secure session management
- Row Level Security (RLS) policies enforce data access controls at the database level
- Passwords are hashed and managed by Supabase (bcrypt)
- Sessions use secure, httpOnly tokens with automatic refresh

### Input Validation
- All user inputs are validated on the client side before submission
- Content length limits are enforced on posts and form fields
- Special characters in search queries are escaped to prevent ILIKE injection
- React's built-in JSX escaping prevents XSS attacks (no `dangerouslySetInnerHTML` usage)

### Environment & Configuration
- All secrets (Supabase URL, anon key) are stored in environment variables
- Frontend environment variables use the `VITE_` prefix and contain only public-safe keys
- The Supabase anon key is designed to be public and is restricted by RLS policies

### Data Protection
- All communication with Supabase uses HTTPS
- Database access is restricted through RLS policies
- User data is only accessible to authorized users based on privacy settings

## Scope

The following are in scope for vulnerability reports:

- Authentication and authorization bypasses
- Data exposure or leakage
- Cross-site scripting (XSS)
- Injection vulnerabilities
- Broken access control

The following are out of scope:

- Denial of service attacks
- Social engineering
- Issues in third-party dependencies (report these to the respective maintainers)
