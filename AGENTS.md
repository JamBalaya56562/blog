# AGENTS.md

This repository is a multilingual blog built with Next.js (App Router).

## Tech Stack

- **Framework**: Next.js (stable, not canary) — App Router, React Server Components, `"use cache"` directive
- **Language**: TypeScript (strict mode, `"module": "preserve"`, `verbatimModuleSyntax`)
- **Runtime / Package Manager**: Bun
- **Styling**: Tailwind CSS v4 + PostCSS
- **Content**: MDX (`next-mdx-remote-client`, `remark-gfm`)
- **Data**: DynamoDB (page view counts, via `@aws-sdk/lib-dynamodb`); DynamoDB Local in development
- **Linter / Formatter**: Biome
- **Testing**: Bun test (unit) + Playwright (E2E)
- **Tool Management**: Mise
- **Deployment**: Docker (distroless + AWS Lambda Web Adapter), provisioned with OpenTofu

## Project Structure

```bash
app/
  [locale]/              # Multilingual routing (en, ja)
    blog/                # Post index (paginated, sortable)
      [slug]/            # Blog post page
    portfolio/           # Portfolio page
    privacy-policy/      # Privacy policy
    feed.xml/            # Per-locale RSS feed
    [...rest]/           # Catch-all for unmatched paths
    opengraph-image.tsx  # OG card (one per route, five in total)
    error.tsx            # Route error boundary, plus not-found.tsx
  api/favicons/[host]/   # Favicon proxy for external links in posts
  api/images/[...path]/  # Image proxy API
  api/views/             # View count API (read and record, called from the browser)
  global-error.tsx       # Error boundary for the root layout itself
  manifest.ts            # Web app manifest, plus robots.ts and sitemap.ts
  globals.css            # Global stylesheet (see Styling)
proxy.ts                 # Redirects unprefixed paths to a negotiated locale
mdx-components.tsx       # Components MDX posts render with (see Styling)
components/              # Shared React components
  blog/ home/            # Components scoped to a single route
  explorables/           # Interactive figures used inside posts
  skeletons/             # Loading skeletons
  ui/                    # Presentational primitives
lib/
  views/                 # View count client (fetch helpers), reader/bot detection, recount window
  content/               # Content loader (local / GitHub), frontmatter, adjacent posts
  db/                    # DynamoDB page view store (client, schema, queries)
  explorables/           # State and logic behind components/explorables, kept pure for tests
  i18n/                  # Internationalization (dictionaries, locale config, negotiation)
  og/                    # Open Graph card rendering (`next/og`)
  theme/                 # Theme provider and hook (dark/light mode)
  routes.ts              # Route definitions
  toc.ts                 # Table of contents generation
content/
  posts/{en,ja}/         # MDX blog posts
  images/                # Content images
infra/                   # OpenTofu configuration for the AWS deployment
mise-tasks/              # Task scripts (DynamoDB Local, lint, thumbnails)
public/                  # Static assets (logos, icons, thumbnails)
test/
  unit/                  # Bun unit tests
  e2e/                   # Playwright E2E tests
```

## Coding Conventions

### General

- Indentation: 2 spaces
- Line endings: LF
- Encoding: UTF-8
- Semicolons: omitted (`"semicolons": "asNeeded"`)
- Trailing newline: yes

Biome's assist actions rewrite source, not just report on it — `bun lint:fix`
will reorder what you wrote — so write code the way they would leave it:

- **Object keys are sorted alphabetically** (`useSortedKeys`). This applies to
  config objects too — `next.config.ts` and `.devcontainer/devcontainer.json`
  are both in key order. `package.json` is exempt, since it keeps the
  conventional npm field order via `useSortedPackageJson`.
- Duplicate Tailwind classes on one element are removed (`noDuplicateClasses`).

### TypeScript

- Adhere to `strict: true`
- Use path alias `@/*` for imports from the project root
- Unused imports are errors (`noUnusedImports: "error"`)
- `useBlockStatements: "error"` — always use block statements `{}`
- `noUselessElse: "error"` — do not write unnecessary else clauses

Beyond these explicit rules, Biome runs with its `next`, `react`, `tailwind`,
`playwright`, `test`, `types` and `project` domains all set to
`recommended`, so framework-specific lints are on without being listed here.

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
- `updated` and `image` are optional. `updated` is rejected if it is earlier
  than `date`, so a revision date cannot silently predate publication
- `lib/content/frontmatter.ts` is the only validator; a field it does not read
  is not part of the format
- `CONTENT_SOURCE` environment variable switches between local / GitHub sources

## Testing Strategy

### Unit Tests

```bash
bun test:unit
```

- Test runner: Bun test (`bun test --isolate`)
- Test root is `test/unit/` and the order is randomized (`bunfig.toml`), so
  tests must not depend on each other or on the order they run in
- Four preloads run before every test, all registered in `bunfig.toml`:
  `happydom.ts` for the DOM environment, and `setup-react-mock.ts`,
  `setup-lucide-mock.ts`, `setup-next-navigation-mock.ts` for the mocks. They
  are global — do not re-register them per file
- Test files are placed under `test/unit/` mirroring the source structure
- File naming: `*.test.ts` / `*.test.tsx`
- Uses Testing Library (`@testing-library/react`, `@testing-library/dom`)
- Property-based testing with `fast-check` is established practice here, not
  just an available dependency; prefer it for pure functions over example rows

### E2E Tests

```bash
mise e2e
```

- Test runner: Playwright
- Test files are placed under `test/e2e/`
- Target browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Playwright starts the production server itself (`bun start`, configured as
  `webServer`), which is why the build has to come first
- `mise e2e` builds, starts the `db` daemon unless it is already running, and
  then runs `bun test:e2e`. `bun run build && bun test:e2e` still works; it leaves
  the app talking to a database nobody started, so every view count in the run
  waits on a refused connection
- CI is limited to 2 retries and 1 worker

## Commands

| Command | Description |
| --- | --- |
| `mise daemons start dev` | Start DynamoDB Local, then the development server, in the background |
| `bun dev` | Start the development server alone (every page stalls while the database is down) |
| `bun run build` | Production build |
| `bun start` | Start production server |
| `bun lint:fix` | Format + lint with Biome (auto-fix) |
| `mise lint` | Everything `bun lint:fix` does, plus markdown, OpenTofu and emphasis checks |
| `bun test:unit` | Run unit tests |
| `bun test:e2e` | Run E2E tests against a build and a database that are already up |
| `mise e2e` | Build, bring the database up, then run the E2E tests |

`mise lint` is what CI runs, so prefer it over `bun lint:fix` before pushing:
Biome does not see markdown or `.tf` files, and `lint:emphasis` reports rather
than repairs.

Other tasks worth knowing (`mise tasks` lists them all): `mise db:scan` dumps
every page view row as JSON, `mise thumbnail <png> <slug>` encodes a post
thumbnail as AVIF, and `mise update` updates Bun dependencies and reinstalls.

`.claude/launch.json` does not start a server of its own. It attaches the browser
preview to `http://localhost:3000`, so bring the server up with
`mise daemons start dev` first. A launcher that ran `bun dev` itself would find no
`bun` — the desktop app inherits the machine environment, not a shell with mise
activated — and would start the server against a database nobody started.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
<type>(<scope>): <summary>
```

- type: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`
- scope: name the part of the repository that changed. `blog` is the most common
  one by far — it is what a new or edited post under `content/posts/` takes.
  Others in regular use: `actions`, `ci`, `common`, `css`, `db`, `devcontainer`,
  `docker`, `e2e`, `i18n`, `infra`, `mdx`, `mise`, `security`, `seo`, `ui`
- summary: imperative, present tense, lowercase first letter, no trailing period

The type list is not a style preference: `.github/workflows/conventional-commits.yml`
runs commitlint with `@commitlint/config-conventional`, which rejects anything
outside it. Scopes are not constrained by that config, so the list above is
convention rather than enforcement. The check validates the **pull request
title** as well as every commit on the branch, so both have to parse.

## Releases

Releases are cut by release-please (`.github/workflows/release-please.yml`),
so the commit type is also what decides the next version: `fix` and `perf`
bump the patch, `feat` the minor, and a `!` after the type or a
`BREAKING CHANGE:` footer the major. The other types release nothing on their
own.

Every push to main updates an open release pull request; every Monday at 09:00
JST it is merged, which tags `vX.Y.Z` and publishes the GitHub release. Do not
edit `package.json`'s `version` or `.github/release-please-manifest.json` by
hand — the release pull request owns both. No `CHANGELOG.md` is kept
(`skip-changelog` in `.github/release-please-config.json`); the notes live on
the GitHub release.
