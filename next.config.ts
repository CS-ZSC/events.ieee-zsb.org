import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		optimizePackageImports: ["@chakra-ui/react"],
	},
	env: {
		API_URL: process.env.API_URL,
	},
};

export default nextConfig;
