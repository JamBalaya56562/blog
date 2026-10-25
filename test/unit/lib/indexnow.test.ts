import { describe, expect, test } from "bun:test"
import fc from "fast-check"
import {
  changedUrls,
  INDEXNOW_KEY,
  isCompleteSitemap,
  parseSitemap,
  submission,
} from "@/lib/indexnow"

type Entry = readonly [string, string | undefined]

function sitemap(entries: readonly Entry[]): string {
  const urls = entries.map(
    ([loc, lastmod]) =>
      `<url>\n<loc>${loc}</loc>\n<xhtml:link rel="alternate" hreflang="en" href="${loc}" />\n${
        lastmod ? `<lastmod>${lastmod}</lastmod>\n` : ""
      }</url>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset>\n${urls.join("\n")}\n</urlset>`
}

const loc = fc
  .stringMatching(/^[a-z0-9-]{1,12}$/)
  .map((slug) => `https://kokohore56562wanwan.site/en/blog/${slug}`)
const lastmod = fc.option(
  fc
    .integer({ max: 4_102_444_800_000, min: 0 })
    .map((time) => new Date(time).toISOString()),
  { nil: undefined },
)
const entries = fc.uniqueArray(fc.tuple(loc, lastmod), {
  maxLength: 20,
  selector: ([url]) => url,
})

describe("parseSitemap", () => {
  test("reads back every loc with its lastmod", () => {
    fc.assert(
      fc.property(entries, (list) => {
        expect([...parseSitemap(sitemap(list))]).toEqual(
          list.map(([url, modified]) => [url, modified]),
        )
      }),
    )
  })

  test("ignores the alternate links, which repeat other URLs", () => {
    const xml = sitemap([["https://kokohore56562wanwan.site/en", undefined]])
    expect([...parseSitemap(xml).keys()]).toEqual([
      "https://kokohore56562wanwan.site/en",
    ])
  })
})

describe("isCompleteSitemap", () => {
  const nonEmpty = entries.filter((list) => list.length > 0)

  test("accepts any sitemap with at least one URL", () => {
    fc.assert(
      fc.property(nonEmpty, (list) => {
        expect(isCompleteSitemap(sitemap(list))).toBe(true)
      }),
    )
  })

  test("rejects a download cut off anywhere before the closing tag", () => {
    fc.assert(
      fc.property(
        nonEmpty.chain((list) => {
          const xml = sitemap(list)
          return fc.tuple(
            fc.constant(xml),
            fc.integer({ max: xml.lastIndexOf("</urlset>"), min: 0 }),
          )
        }),
        ([xml, cut]) => {
          expect(isCompleteSitemap(xml.slice(0, cut))).toBe(false)
        },
      ),
    )
  })

  test("rejects an empty file, an empty sitemap and an HTML page", () => {
    expect(isCompleteSitemap("")).toBe(false)
    expect(isCompleteSitemap(sitemap([]))).toBe(false)
    expect(isCompleteSitemap("<!DOCTYPE html><html></html>")).toBe(false)
  })
})

describe("changedUrls", () => {
  test("is empty when nothing changed", () => {
    fc.assert(
      fc.property(entries, (list) => {
        expect(changedUrls(sitemap(list), sitemap(list))).toEqual([])
      }),
    )
  })

  test("lists every URL when there was nothing before", () => {
    fc.assert(
      fc.property(entries, (list) => {
        expect(changedUrls("", sitemap(list))).toEqual(list.map(([url]) => url))
      }),
    )
  })

  test("lists exactly the added URLs and those whose lastmod moved", () => {
    fc.assert(
      fc.property(entries, entries, (before, after) => {
        const previous = new Map(before)
        const expected = after
          .filter(
            ([url, modified]) =>
              !previous.has(url) || previous.get(url) !== modified,
          )
          .map(([url]) => url)
        expect(changedUrls(sitemap(before), sitemap(after))).toEqual(expected)
      }),
    )
  })

  test("leaves removed URLs out", () => {
    const gone = "https://kokohore56562wanwan.site/en/blog/gone"
    const kept: Entry = ["https://kokohore56562wanwan.site/en", "2026-10-25"]
    expect(
      changedUrls(sitemap([kept, [gone, "2026-10-01"]]), sitemap([kept])),
    ).toEqual([])
  })
})

describe("submission", () => {
  test("names this host and the key file at the site root", () => {
    expect(submission(["https://kokohore56562wanwan.site/en"])).toEqual({
      host: "kokohore56562wanwan.site",
      key: INDEXNOW_KEY,
      keyLocation: `https://kokohore56562wanwan.site/${INDEXNOW_KEY}.txt`,
      urlList: ["https://kokohore56562wanwan.site/en"],
    })
  })
})

describe("key file", () => {
  test("public/<key>.txt holds the key, so search engines accept it", async () => {
    const file = Bun.file(
      `${import.meta.dir}/../../../public/${INDEXNOW_KEY}.txt`,
    )
    expect((await file.text()).trim()).toBe(INDEXNOW_KEY)
  })

  test("the key fits the IndexNow format", () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-zA-Z0-9-]{8,128}$/)
  })
})
