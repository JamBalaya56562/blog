const NOT_A_READER = /bot|crawl|spider|slurp|headless|facebookexternalhit/i

export function isReader(userAgent: string | null): boolean {
  if (!userAgent) {
    return false
  }

  return !NOT_A_READER.test(userAgent)
}
