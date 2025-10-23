import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    isrFlushToDisk: false,
    viewTransition: true,
  },
  cacheComponents: true,
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
}

export default nextConfig
