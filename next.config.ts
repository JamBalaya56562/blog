import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  output: "standalone",
}

export default nextConfig
