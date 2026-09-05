import createMDX from "@next/mdx"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    inlineCss: true,
    isrFlushToDisk: false,
    serverActions: {
      allowedOrigins: ["kokohore56562wanwan.site"],
    },
    strictRouteTypes: true,
  },
  images: { unoptimized: true },
  output: "standalone",
  outputFileTracingExcludes: {
    "**/*": ["./node_modules/@img/**", "./node_modules/sharp/**"],
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  reactCompiler: true,
  // Kept out of the bundle so the SDK ships as real modules. Bundled, the
  // standalone trace comes out with only one @aws-sdk package and no @smithy
  // ones at all: the credential providers and the Node HTTP handler are reached
  // through dynamic requires the bundler cannot follow. Local development never
  // notices, because it passes explicit credentials to a local endpoint, but
  // Lambda resolves credentials from its execution role through exactly those
  // providers.
  serverExternalPackages: ["@aws-sdk/client-dynamodb", "@aws-sdk/lib-dynamodb"],
  typedRoutes: true,
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
})

export default withMDX(nextConfig)
