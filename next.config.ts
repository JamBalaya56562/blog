import withRspack from "@next/plugin-rspack"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    isrFlushToDisk: false,
    ppr: true,
    reactCompiler: true,
    viewTransition: true,
  },
  output: "standalone",
}

export default withRspack(nextConfig)
