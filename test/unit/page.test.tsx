import { expect, test } from "bun:test"

test("Root page redirects to /en", async () => {
  // Dynamic import avoids redirect/usePathname side effects during module evaluation
  const { default: RootPage } = await import("@/app/page.tsx")

  try {
    RootPage()
  } catch (e: unknown) {
    const error = e as { digest?: string }
    expect(error.digest).toContain("NEXT_REDIRECT")
    expect(error.digest).toContain("/en")
  }
})
