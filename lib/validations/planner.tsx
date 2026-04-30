import * as z from "zod";

// lib/validations/planner.ts
// import type { Category } from "@prisma/client";

// EN: Define categories as a constant array to avoid runtime dependency on Prisma Client in the browser
// PL: Definiujemy kategorie jako stałą, aby uniknąć zależności od Prisma Client w przeglądarce
export const CATEGORY_VALUES = [
	"BONDS",
	"DEVELOPED",
	"EMERGING",
	"GOLD",
	"BOOSTER",
	"CASH",
	"CRYPTO",
	"CRYPTO",
	"COMMODITIES",
] as const;

export const PlannerSchema = z.object({
	name: z.string().min(1, "Nazwa jest wymagana"),
	ticker: z.string().optional().nullable(), // EN: Allow null for DB compatibility
	value: z.coerce.number().min(0.01, "Kwota musi być większa od 0"),
	plannedDate: z.string().regex(/^\d{4}-\d{2}$/, "Wybierz miesiąc i rok"),
	portfolioId: z.string().min(1, "Wybierz portfel docelowy"),

	// EN: Use nativeEnum for Prisma Enums to avoid "Invalid option" errors
	// UI: Używamy nativeEnum dla Enumów Prismy, aby uniknąć błędów walidacji
	category: z.enum(CATEGORY_VALUES),
	// interestRate: z.coerce.number().optional().default(0), // NOWE POLE

	conviction: z.number().min(1).max(100).optional().nullable(),
	rationale: z.string().optional().nullable(),
	isRecurring: z.boolean().default(false),
});
