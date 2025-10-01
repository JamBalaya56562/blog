import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    isrFlushToDisk: false,
    ppr: true,
    viewTransition: true,
  },
  output: "standalone",
  reactCompiler: true,
  typedRoutes: true,
}

export default nextConfig
