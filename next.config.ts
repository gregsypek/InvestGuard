import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "logo.clearbit.com",
			},
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
			},
			{ protocol: "https", hostname: "www.google.com" },
		],
	},
};

export default nextConfig;
