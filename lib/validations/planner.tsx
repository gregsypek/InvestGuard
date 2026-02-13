import { Category } from "@prisma/client";
import * as z from "zod";

// Musimy użyć as [string, ...string[]], aby Zod wiedział, że tablica nie jest pusta
const categoryValues = Object.values(Category) as [string, ...string[]];
console.log("🚀 ~ categoryValues:", categoryValues)

export const PlannerSchema = z.object({
	name: z.string().min(1, "Nazwa jest wymagana"),
	ticker: z.string().optional(),
	value: z.coerce.number().min(0.01, "Kwota musi być większa od 0"),
	// Tu pojawi się nasze nowe pole daty
	plannedDate: z.string().regex(/^\d{4}-\d{2}$/, "Wybierz miesiąc i rok"),
	portfolioId: z.string().min(1, "Wybierz portfel docelowy"),
	category: z.enum(categoryValues),
	rationale: z.string().optional(),
	// Nowe pole dla harmonogramu
	isRecurring: z.boolean().default(false),
});
