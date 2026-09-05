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
  typedRoutes: true,
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
})

export default withMDX(nextConfig)
