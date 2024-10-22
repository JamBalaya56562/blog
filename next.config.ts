import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    reactCompiler: true,
  },
  output: "standalone",
}

export default nextConfig
