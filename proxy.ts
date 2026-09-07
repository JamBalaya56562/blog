import { type NextRequest, NextResponse } from "next/server"
import { defaultLocale, locales } from "@/lib/i18n/config"

function hasLocalePrefix(pathname: string): boolean {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  )
}

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
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/)(?!.*\\..+$).*)",
  ],
}
