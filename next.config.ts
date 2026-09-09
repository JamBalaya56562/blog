import createMDX from "@next/mdx"
import type { NextConfig } from "next"

/**
 * `headers()` is evaluated once at build time and baked into
 * `routes-manifest.json`, so this reflects `next build` versus `next dev`.
 */
const isDev = process.env.NODE_ENV !== "production"

/**
 * A nonce-based CSP is not available here, and that is a constraint rather than
 * an oversight. `cacheComponents` makes every route partially prerendered, and
 * Next's own CSP guide states that PPR is incompatible with nonces because the
 * static shell's scripts cannot receive a per-request value. The prerendered
 * shells carry dozens of nonce-less `self.__next_f.push(...)` bootstrap scripts
 * whose contents differ per page, so hashes cannot be enumerated in a static
 * header either. `'unsafe-inline'` in `script-src` is what the guide prescribes
 * for this configuration.
 *
 * So this policy does not stop an injected `<script>` block. What it does buy
 * is a closed door on external origins, framing, `<base>`, form targets and
 * plugins, and — through `script-src-attr` below — on injected inline event
 * handlers, which `script-src` alone would have waved through.
 */
const siteCsp = [
  "default-src 'self'",
  // Next's RSC bootstrap plus components/theme-init-script.tsx, the FOUC guard.
  // 'unsafe-eval' is Turbopack's HMR and must never reach production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // `script-src` has to carry 'unsafe-inline' for the reason above, and without
  // this line `script-src-attr` inherits it, which would let an injected
  // `onclick=` run. React attaches every listener with addEventListener and
  // never serialises a handler into an attribute, so nothing here needs them:
  // the production HTML of every route contains no `on*=` attribute at all.
  //
  // This is the one part of the script policy that an injection actually feels,
  // so it is worth keeping 'none'. Anything that later needs an inline handler
  // should get a real listener instead of a relaxation here.
  "script-src-attr 'none'",
  // `experimental.inlineCss` emits the compiled CSS as an inline <style>.
  "style-src 'self' 'unsafe-inline'",
  // The `style={{}}` attributes in scroll-progress, table-of-contents and
  // view-counts. All three interpolate a value, so hashing them is not an
  // option.
  "style-src-attr 'unsafe-inline'",
  // Every image is same-origin. `data:` is required by exactly one thing: the
  // data:image/svg+xml noise texture behind `.pp-noise` in app/globals.css.
  //
  // Worth knowing: mdx-components.tsx passes an absolute http(s) `img` src
  // through untouched, so the first post that hotlinks a remote image will be
  // blocked here with no build-time warning. Add the origin when that happens.
  "img-src 'self' data:",
  // next/font/google self-hosts into /_next/static/media at build time.
  "font-src 'self'",
  // There is no client-side fetch, XHR or WebSocket in the app. Only Server
  // Actions and RSC prefetches, both same-origin. `ws:` is the dev HMR socket.
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "manifest-src 'self'",
  "media-src 'none'",
  "object-src 'none'",
  `frame-src ${isDev ? "'self'" : "'none'"}`,
  "worker-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Production only. The StackBlitz Codeflow link that preview.yml posts on
  // every PR runs this repo's dev server inside a WebContainer and shows it in
  // an iframe on stackblitz.com, using this same config. Refusing to be framed
  // in development would blank that preview pane.
  ...(isDev ? [] : ["frame-ancestors 'none'"]),
].join("; ")

/**
 * Nothing here uses a camera, a microphone, location, payment or a sensor, so
 * every such feature is switched off outright. `fullscreen` stays available to
 * the page itself rather than being denied, since a reader's browser UI can
 * legitimately ask for it.
 *
 * Only features the engines actually recognise are listed. An unknown one
 * produces a console warning, which would fight the CSP violation checks in
 * test/e2e/security-headers.test.ts. `browsing-topics` is deliberately absent
 * for that reason: it is Chrome-only and warns everywhere else.
 */
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
  // Says the same thing as `frame-ancestors` for clients that predate it, and
  // is held back in development for the same StackBlitz reason.
  ...(isDev ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
  // Browsers ignore HSTS delivered over plain http, so this is inert on
  // localhost and safe to send unconditionally. `preload` is left off: the
  // preload list is a one-way door that takes months to back out of.
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
]

const nextConfig: NextConfig = {
  agentRules: false,
  cacheComponents: true,
  experimental: {
    inlineCss: true,
    isrFlushToDisk: false,
    serverActions: {
      allowedOrigins: ["kokohore56562wanwan.site"],
    },
    strictRouteTypes: true,
  },
  async headers() {
    return [
      {
        // Everything but the image route, which takes the stricter policy
        // below. This is the only layer that reaches _next/static, sitemap.xml,
        // robots.txt, manifest.webmanifest, feed.xml and the opengraph-image
        // routes: proxy.ts's matcher excludes every one of them.
        headers: [
          { key: "Content-Security-Policy", value: siteCsp },
          ...commonSecurityHeaders,
        ],
        source: "/((?!api/images/).*)",
      },
      {
        // app/api/images/[...path]/route.ts serves image/svg+xml. As an <img>
        // subresource an SVG cannot script, but open the URL directly and it
        // becomes a same-origin document, where the site policy's
        // 'unsafe-inline' would happily run a <script> inside the file.
        // `sandbox` drops the response into an opaque origin with scripting
        // disabled, and applies only when a document is created, so <img> loads
        // are untouched.
        //
        // `nosniff` earns its keep here too: this is the one route whose
        // Content-Type is guessed from a filename extension.
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
    ]
  },
  images: { unoptimized: true },
  output: "standalone",
  outputFileTracingExcludes: {
    "**/*": ["./node_modules/@img/**", "./node_modules/sharp/**"],
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Drops the `X-Powered-By: Next.js` fingerprint.
  poweredByHeader: false,
  reactCompiler: true,
  transpilePackages: ["shiki"],
  typedRoutes: true,
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
})

export default withMDX(nextConfig)
