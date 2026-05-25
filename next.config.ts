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
				hostname: "www.google.com",
			},
			{
				protocol: "https",
				hostname: "raw.githubusercontent.com",
			},
			{ protocol: "https", hostname: "www.google.com" },
			{
				// EN: Allow secure image fetching from the ShortPixel CDN proxy domain
				protocol: "https",
				hostname: "sp-ao.shortpixel.ai",
				port: "",
				pathname: "/**", // EN: Allow all paths under this domain
			},
		],
	},
};

export default nextConfig;
