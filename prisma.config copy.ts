// prisma.config.ts
import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default defineConfig({
	datasource: {
		// Ensure the key matches exactly what's in your .env file (e.g., DATABASE_URL)
		url: process.env.DATABASE_URL,
	},
});
