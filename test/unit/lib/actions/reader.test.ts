import { describe, expect, test } from "bun:test"
import { isReader } from "@/lib/actions/reader"

const BROWSERS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  "Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 OPR/126.0.0.0",
]

const CRAWLERS = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36",
  "Mozilla/5.0 (compatible; DuckDuckBot-Https/1.1; https://duckduckgo.com/duckduckbot)",
  "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
  "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "Twitterbot/1.0",
  "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
  "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
  "Mozilla/5.0 (compatible; Bytespider; https://zhanzhang.toutiao.com/) AppleWebKit/537.36",
  "Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)",
  "Applebot/0.1 (+http://www.apple.com/go/applebot)",
  "Discordbot/2.0 (+https://discordapp.com)",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36",
]

/**
 * The count is written from a client effect, so anything that does not run
 * JavaScript was never counted to begin with — this is about the crawlers that
 * render, Googlebot above all, and about the DynamoDB write each of them bills.
 *
 * The check is six words — `bot`, `crawl`, `spider`, `slurp`, `headless`,
 * `facebookexternalhit` — rather than a list of crawlers to keep up with or a
 * dependency to track: every crawler worth naming announces itself with one of
 * them, and no browser string contains any. That is a claim about real user
 * agents, so this file is the real user agents, asserted in both directions —
 * a one-sided test would pass just as well if the function always said no.
 */
describe("isReader", () => {
  for (const userAgent of BROWSERS) {
    test(`counts ${userAgent.slice(0, 40)}…`, () => {
      expect(isReader(userAgent)).toBe(true)
    })
  }

  for (const userAgent of CRAWLERS) {
    test(`does not count ${userAgent.slice(0, 40)}…`, () => {
      expect(isReader(userAgent)).toBe(false)
    })
  }

  // A browser always sends one. Nothing that omits it is a reader, and the
  // header is the only thing the action has to go on.
  test("does not count a client that sends no user agent", () => {
    expect(isReader(null)).toBe(false)
    expect(isReader("")).toBe(false)
  })
})
