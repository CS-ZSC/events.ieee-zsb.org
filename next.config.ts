import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@chakra-ui/react"],
  },
  // Removed manual env mapping as NEXT_PUBLIC_ is automatically handled by Next.js
  // This reduces configuration overhead and potential sync issues.
};

export default nextConfig;