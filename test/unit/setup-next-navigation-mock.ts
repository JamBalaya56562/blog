import { mock } from "bun:test"

// Preload mock for next/navigation to resolve ESM export issues in Bun.
// next/navigation's CJS entry point may not expose all named exports that
// ESM consumers expect, causing "Export named '...' not found" errors.
// Individual test files can override this mock with their own mock.module() call.
mock.module("next/navigation", () => ({
  redirect: () => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/en",
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
  forbidden: () => {
    throw new Error("NEXT_FORBIDDEN")
  },
  unauthorized: () => {
    throw new Error("NEXT_UNAUTHORIZED")
  },
  RedirectType: { push: "push", replace: "replace" },
}))
