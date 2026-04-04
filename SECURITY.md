# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.8.x   | :white_check_mark: |
| < 0.8   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly via [GitHub Security Advisories](https://github.com/JamBalaya56562/blog/security/advisories/new).

Please do not open a public issue for security vulnerabilities.

### What to include

- A description of the vulnerability
- Steps to reproduce the issue
- Affected versions
- Any potential impact

### Response timeline

- We will acknowledge your report within 7 days.
- We aim to provide a fix or mitigation plan within 30 days, depending on severity.
- You will be notified when the issue is resolved.

### Scope

The following areas are in scope for security reports:

- API route handlers (`app/api/`)
- Server Components and data fetching
- MDX content rendering and sanitization
- Image proxy API
- Docker image and deployment configuration
- Dependency vulnerabilities

### Out of scope

- Issues in third-party services (e.g., GitHub API, AWS) that are not caused by this project's code
- Denial of service attacks against development environments
- Social engineering
