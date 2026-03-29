import { type NextRequest, NextResponse } from "next/server"
import { defaultLocale, isValidLocale, locales } from "@/lib/i18n/config"

/**
 * Checks if the pathname already starts with a supported locale prefix.
 */
function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
}

/**
 * Redirects requests without a locale prefix to the default locale.
 * e.g. `/blog` → `/en/blog`, `/` → `/en`
 */
export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname } = request.nextUrl

  if (hasLocalePrefix(pathname)) {
    return undefined
  }

  const url = request.nextUrl.clone()
  url.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - api routes
     * - files with extensions (e.g. .png, .jpg, .css, .js)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/).*)",
  ],
}
