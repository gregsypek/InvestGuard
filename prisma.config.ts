import * as dotenv from "dotenv";

// prisma.config.ts
import { defineConfig } from "@prisma/config";

dotenv.config(); // Kluczowe dla poprawnego odczytu .env

export default defineConfig({
	schema: "prisma/schema.prisma",
	datasource: {
		url: process.env.DATABASE_URL,
	},
});
