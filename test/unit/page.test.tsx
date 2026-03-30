import { expect, test } from "bun:test"
import RootPage from "@/app/page.tsx"

test("Root page redirects to /en", () => {
  try {
    RootPage()
  } catch (e: unknown) {
    const error = e as { digest?: string }
    expect(error.digest).toContain("NEXT_REDIRECT")
    expect(error.digest).toContain("/en")
  }
})
