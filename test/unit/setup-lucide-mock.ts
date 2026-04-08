import { mock } from "bun:test"

// Preload mock for next/navigation to resolve CJS/ESM interop issue in Bun.
// next/navigation.js is a CJS re-export (`module.exports = require(...)`) with
// no "exports" field in package.json, so Bun cannot reliably extract named ESM
// exports such as `redirect` or `usePathname`.
// Individual test files can override this mock with their own mock.module() call.
mock.module("next/navigation", () => ({
  redirect: () => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/en;307;",
    })
  },
  permanentRedirect: () => {},
  usePathname: () => "/en",
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    refresh: () => {},
    back: () => {},
    forward: () => {},
    prefetch: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
  ReadonlyURLSearchParams: URLSearchParams,
  RedirectType: { push: "push", replace: "replace" },
}))

// Preload mock for lucide-react to resolve CJS/ESM interop issue in Bun.
// lucide-react v1.7.0 has no "exports" field in package.json, so Bun resolves
// the CJS entry point and fails to extract named ESM exports.
// Individual test files can override this mock with their own mock.module() call.
const Stub = () => null
mock.module("lucide-react", () => ({
  ArrowUp: Stub,
  BookOpen: Stub,
  Box: Stub,
  ExternalLink: Stub,
  FolderOpen: Stub,
  Globe: Stub,
  Heart: Stub,
  MapPin: Stub,
  Moon: Stub,
  Paintbrush: Stub,
  Puzzle: Stub,
  Sparkles: Stub,
  Sun: Stub,
  Terminal: Stub,
  User: Stub,
  Wrench: Stub,
}))
