import { describe, expect, mock, test } from "bun:test"
import { render } from "@testing-library/react"
import { locales } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/get-dictionary"

mock.module("next/navigation", () => ({
  usePathname: () => "/en",
}))

import { Header } from "@/components/header"

describe("Header debug", () => {
  test("dump all links for en", () => {
    const dictionary = getDictionary("en")
    const { container } = render(<Header locale="en" dictionary={dictionary} />)
    const links = container.querySelectorAll("a")
    for (const link of links) {
      console.log("href:", link.getAttribute("href"), "text:", link.textContent)
    }
  })
})
