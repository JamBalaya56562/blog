import { afterEach, describe, expect, test } from "bun:test"
import { cleanup, render } from "@testing-library/react"
import { IndexCounts } from "@/components/blog/index-counts"
import { getDictionary } from "@/lib/i18n/get-dictionary"

afterEach(cleanup)

function textOf(posts: number, tags: number, locale: "en" | "ja") {
  const { container } = render(
    <IndexCounts
      posts={posts}
      tags={tags}
      dictionary={getDictionary(locale).blog}
    />,
  )
  return container.textContent
}

describe("IndexCounts", () => {
  test("shows the result size and the tag count with their labels", () => {
    expect(textOf(7, 9, "en")).toBe("7 posts9 tags")
    expect(textOf(7, 9, "ja")).toBe("7 件9 タグ")
  })

  test("uses the singular for one", () => {
    expect(textOf(1, 1, "en")).toBe("1 post1 tag")
    expect(textOf(1, 1, "ja")).toBe("1 件1 タグ")
  })

  test("a result of none still reads as a count", () => {
    expect(textOf(0, 9, "en")).toBe("0 posts9 tags")
  })
})
