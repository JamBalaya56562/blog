# AGENTS.md

This repository is a multilingual blog built with Next.js (App Router).

## Tech Stack

- **Framework**: Next.js (canary) — App Router, React Server Components, `"use cache"` directive
- **Language**: TypeScript (strict mode, `"module": "esnext"`)
- **Runtime / Package Manager**: Bun
- **Styling**: Tailwind CSS v4 + PostCSS
- **Content**: MDX (`next-mdx-remote-client`, `remark-gfm`)
- **Linter / Formatter**: Biome
- **Testing**: Bun test (unit) + Playwright (E2E)
- **Tool Management**: Mise
- **Deployment**: Docker (distroless + AWS Lambda Web Adapter)

## Project Structure

```bash
app/                  # Next.js App Router pages
  [locale]/           # Multilingual routing (en, ja)
    blog/[slug]/      # Blog post page
    privacy-policy/   # Privacy policy
  api/images/         # Image proxy API
components/           # Shared React components
lib/
  content/            # Content loader (local / GitHub)
  i18n/               # Internationalization (dictionaries, locale config)
  toc.ts              # Table of contents generation
content/
  posts/{en,ja}/      # MDX blog posts
  images/             # Content images
test/
  unit/               # Bun unit tests
  e2e/                # Playwright E2E tests
```

## Coding Conventions

### General

- Indentation: 2 spaces
- Line endings: LF
- Encoding: UTF-8
- Semicolons: omitted (`"semicolons": "asNeeded"`)
- Trailing newline: yes

### TypeScript

- Adhere to `strict: true`
- Use path alias `@/*` for imports from the project root
- Unused imports are errors (`noUnusedImports: "error"`)
- `useBlockStatements: "error"` — always use block statements `{}`
- `noUselessElse: "error"` — do not write unnecessary else clauses

### React / Next.js

- React Compiler is enabled (`reactCompiler: true`)
- Use Server Components by default; only add `"use client"` when necessary
- Leverage `"use cache"` directive for cache control
- Apply `Readonly<>` to component props
- Use typed routes (`typedRoutes: true`)

### Content

- Blog posts are placed as MDX files in `content/posts/{locale}/`
- Frontmatter must include `title`, `date`, `description`, `tags`
- `CONTENT_SOURCE` environment variable switches between local / GitHub sources

## Testing Strategy

### Unit Tests

```bash
bun test:unit
```

- Test runner: Bun test
- DOM environment: Happy DOM (globally registered via `happydom.ts`)
- `next/image`, `next/link` are replaced with mocks
- Test files are placed under `test/unit/` mirroring the source structure
- File naming: `*.test.ts` / `*.test.tsx`
- Uses Testing Library (`@testing-library/react`, `@testing-library/dom`)
- Property-based testing: `fast-check` is available

### E2E Tests

```bash
bun run build && bun test:e2e
```

- Test runner: Playwright
- Test files are placed under `test/e2e/`
- Target browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Standalone server (`bun .next/standalone/server.js`) is started before tests
- CI is limited to 2 retries and 1 worker

## Commands

| Command | Description |
| --- | --- |
| `bun dev` | Start development server |
| `bun run build` | Production build |
| `bun start` | Start production server |
| `bun lint:fix` | Format + lint with Biome (auto-fix) |
| `bun test:unit` | Run unit tests |
| `bun test:e2e` | Run E2E tests |

## Post-Change Workflow

- After making changes, always run `bun lint:fix` to auto-fix formatting and lint issues

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<type>(<scope>): <summary>
```

- type: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- scope (e.g.): `biome`, `bun`, `common`, `css`, `docker`, `git`, `security`, `vscode`
- summary: imperative, present tense, lowercase first letter, no trailing period
