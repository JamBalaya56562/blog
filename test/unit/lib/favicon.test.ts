import { describe, expect, test } from "bun:test"
import {
  externalHost,
  faviconPath,
  faviconSource,
  isHostname,
} from "@/lib/favicon"

describe("externalHost", () => {
  test("an absolute link to another site gives its host", () => {
    expect(externalHost("https://github.com/JamBalaya56562/blog")).toBe(
      "github.com",
    )
    expect(externalHost("http://example.org/")).toBe("example.org")
  })

  test("the port and the case are dropped and an IDN is punycoded", () => {
    expect(externalHost("https://Example.COM:8443/x")).toBe("example.com")
    expect(externalHost("https://日本語.jp/")).toBe("xn--wgv71a119e.jp")
  })

  test("a link that stays on the site gives nothing", () => {
    expect(externalHost("/ja/blog/getting-started-with-mise")).toBeNull()
    expect(externalHost("#setup")).toBeNull()
    expect(externalHost("../images/a.png")).toBeNull()
    expect(externalHost("https://kokohore56562wanwan.site/ja")).toBeNull()
  })

  test("a link that is not a web page gives nothing", () => {
    expect(externalHost("mailto:someone@example.com")).toBeNull()
    expect(externalHost("tel:+81300000000")).toBeNull()
    expect(externalHost("javascript:void(0)")).toBeNull()
    expect(externalHost(undefined)).toBeNull()
    expect(externalHost("")).toBeNull()
  })

  test("a bare or numeric host gives nothing", () => {
    expect(externalHost("http://localhost:3000/")).toBeNull()
    expect(externalHost("http://127.0.0.1/")).toBe("127.0.0.1")
    expect(externalHost("http://[::1]/")).toBeNull()
  })
})

describe("isHostname", () => {
  test("accepts dotted labels and rejects anything a path could smuggle", () => {
    expect(isHostname("github.com")).toBe(true)
    expect(isHostname("docs.aws.amazon.com")).toBe(true)
    expect(isHostname("localhost")).toBe(false)
    expect(isHostname("github.com/x")).toBe(false)
    expect(isHostname("a..b")).toBe(false)
    expect(isHostname("Github.com")).toBe(false)
    expect(isHostname("")).toBe(false)
  })
})

describe("the two addresses", () => {
  test("the page asks this site and the route asks the icon service", () => {
    expect(faviconPath("github.com")).toBe("/api/favicons/github.com")
    expect(faviconSource("github.com")).toBe(
      "https://www.google.com/s2/favicons?domain=github.com&sz=32",
    )
  })
})
