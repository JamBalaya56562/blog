import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    cacheComponents: true,
    inlineCss: true,
    isrFlushToDisk: false,
    viewTransition: true,
  },
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
}

export default nextConfig
