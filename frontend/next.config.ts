import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  /*
   * The dev overlay renders a <nextjs-portal> fixed to the bottom-left, over
   * the sidebar user menu. It intercepted pointer events during E2E runs and
   * made the log-out test fail intermittently:
   *   <nextjs-portal> ... subtree intercepts pointer events
   * It only appears in `next dev`, which is what the compose stack serves.
   */
  devIndicators: false,
}

export default nextConfig
