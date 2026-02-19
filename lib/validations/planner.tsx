// lib/validations/planner.ts
import { Category } from "@prisma/client";
import * as z from "zod";

export const PlannerSchema = z.object({
	name: z.string().min(1, "Nazwa jest wymagana"),
	ticker: z.string().optional().nullable(), // EN: Allow null for DB compatibility
	value: z.coerce.number().min(0.01, "Kwota musi być większa od 0"),
	plannedDate: z.string().regex(/^\d{4}-\d{2}$/, "Wybierz miesiąc i rok"),
	portfolioId: z.string().min(1, "Wybierz portfel docelowy"),

	// EN: Use nativeEnum for Prisma Enums to avoid "Invalid option" errors
	// UI: Używamy nativeEnum dla Enumów Prismy, aby uniknąć błędów walidacji
	category: z.enum(Category),

	rationale: z.string().optional().nullable(),
	isRecurring: z.boolean().default(false),
});
