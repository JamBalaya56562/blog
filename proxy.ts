import { type NextRequest, NextResponse } from "next/server"
import { hasLocalePrefix, preferredLocale } from "@/lib/i18n/negotiate"

export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl

  if (hasLocalePrefix(pathname)) {
    return undefined
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${preferredLocale(request.headers.get("accept-language"))}${pathname}`
  const response = NextResponse.redirect(url)
  response.headers.set("Vary", "Accept-Language")

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/)(?!.*\\..+$).*)",
  ],
}
