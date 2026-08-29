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
	// Ticker i Nazwa nie są już bezwzględnie wymagane przy planowaniu!
	name: z.string().optional().or(z.literal("")),
	ticker: z.string().optional().or(z.literal("")),
	value: z.number().min(1, "Kwota musi być większa niż 0"),
	plannedDate: z.string().regex(/^\d{4}-\d{2}$/, "Wybierz miesiąc i rok"),
	portfolioId: z.string().min(1, "Wybierz portfel"),
	// category: z.string().min(1, "Wybierz kategorię"),
	// EN: Use nativeEnum for Prisma Enums to avoid "Invalid option" errors
	// UI: Używamy nativeEnum dla Enumów Prismy, aby uniknąć błędów walidacji
	category: z.enum(CATEGORY_VALUES),

	rationale: z.string().optional(),
	isRecurring: z.boolean().default(false),
	conviction: z.number().nullable().optional(),
});
