# AGENTS.md

This repository is a multilingual blog built with Next.js (App Router).

## Tech Stack

- **Framework**: Next.js (canary) — App Router, React Server Components, `"use cache"` directive
- **Language**: TypeScript (strict mode, `"module": "preserve"`, `verbatimModuleSyntax`)
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
    portfolio/        # Portfolio page
    privacy-policy/   # Privacy policy
  api/images/         # Image proxy API
components/           # Shared React components
lib/
  content/            # Content loader (local / GitHub), adjacent post utils
  i18n/               # Internationalization (dictionaries, locale config)
  theme/              # Theme provider and hook (dark/light mode)
  routes.ts           # Route definitions
  toc.ts              # Table of contents generation
content/
  posts/{en,ja}/      # MDX blog posts
  images/             # Content images
public/               # Static assets (logos, icons)
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

### Styling

`app/globals.css` and Tailwind utilities share the same elements, so ownership
is split **by property**, not by element.

- **`@layer components` owns multi-property primitives** — `.pp-btn`,
  `.pp-tag`, `.prose-cyber` and friends. Whatever they declare belongs to the
  stylesheet.
- **Utility classes own per-instance adjustments** — spacing, layout,
  one-off colours.
- **Never declare the same property in both for the same element.** The
  utility wins, so the stylesheet's value becomes dead code that still reads as
  if it applies.

Every rule added to `globals.css` must go **inside a layer**. Tailwind's
`@import` establishes `theme, base, components, utilities`, and an unlayered
rule outranks every layered one regardless of specificity — it would silently
beat any utility written on the same element. Only put a rule outside a layer
when it must outrank utilities (`prefers-reduced-motion`) or when no utility
can reach it (view transition pseudo-elements, `:root` theme tokens), and say
why in a comment. `test/unit/globals-css.test.ts` enforces this.

MDX output follows the same split: `.prose-cyber` owns what it declares, and
`mdx-components.tsx` supplies only the rest.

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

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<type>(<scope>): <summary>
```

- type: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- scope (e.g.): `biome`, `bun`, `common`, `css`, `docker`, `git`, `security`, `vscode`
- summary: imperative, present tense, lowercase first letter, no trailing period

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
