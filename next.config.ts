import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV !== "production"

const siteCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  `style-src 'self'${isDev ? " 'unsafe-inline'" : ""}`,
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "manifest-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  `frame-src ${isDev ? "'self'" : "'none'"}`,
  "worker-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["frame-ancestors 'none'"]),
].join("; ")

const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=()",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  "picture-in-picture=()",
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ")

const commonSecurityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(isDev ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
]

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  experimental: {
    isrFlushToDisk: false,
    serverActions: {
      allowedOrigins: ["kokohore56562wanwan.site"],
    },
    strictRouteTypes: true,
  },
  async headers() {
    return [
      {
        headers: [
          { key: "Content-Security-Policy", value: siteCsp },
          ...commonSecurityHeaders,
        ],
        source: "/((?!api/images/).*)",
      },
      {
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; sandbox",
          },
          ...commonSecurityHeaders,
        ],
        source: "/api/images/:path*",
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
        source: "/((?!_next/|api/).*\\.(?:avif|jpe?g|png|svg|webp|ico|woff2))",
      },
      {
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
        source: "/(sitemap\\.xml|robots\\.txt|manifest\\.webmanifest)",
      },
    ]
  },
  images: { unoptimized: true },
  output: "standalone",
  outputFileTracingExcludes: {
    "**/*": ["./node_modules/@img/**", "./node_modules/sharp/**"],
  },
  pageExtensions: ["js", "jsx", "ts", "tsx"],
  poweredByHeader: false,
  reactCompiler: true,
  transpilePackages: ["shiki"],
  typedRoutes: true,
}

export default nextConfig
