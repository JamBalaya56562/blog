import { mock } from "bun:test"

// Preload mock for next/navigation to resolve ESM export issues in Bun.
// next/navigation's CJS entry point may not expose all named exports that
// ESM consumers expect, causing "Export named '...' not found" errors.
//
// IMPORTANT: Individual test files that override this mock MUST spread
// `nextNavigationMock` to preserve all exports. Bun's mock.module()
// replaces the entire module, and partial overrides leak across test files
// on Bun canary (Linux CI), causing "Export named '...' not found" errors.
// See: https://github.com/oven-sh/bun/issues/12823
export const nextNavigationMock = {
  forbidden: () => {
    throw new Error("NEXT_FORBIDDEN")
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
  permanentRedirect: () => {},
  RedirectType: { push: "push", replace: "replace" },
  redirect: () => {
    throw Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/en",
    })
  },
  unauthorized: () => {
    throw new Error("NEXT_UNAUTHORIZED")
  },
  useParams: () => ({}),
  usePathname: () => "/en",
  useRouter: () => ({
    back: () => {},
    forward: () => {},
    prefetch: () => {},
    push: () => {},
    refresh: () => {},
    replace: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
}

mock.module("next/navigation", () => nextNavigationMock)
