import * as z from "zod";

export const AddAssetSchema = z.object({
	portfolioId: z.string().min(1),
	category: z.string().min(1, "Wybierz kategorię"),
	existingAssetId: z.string().default("new"),
	ticker: z.string().min(1, "Ticker jest wymagany"),
	name: z.string().min(1, "Nazwa jest wymagana"),
	investedCapital: z.coerce.number().min(0.01, "Wkład musi być większy niż 0"), // To sprawia, że pole jest "wymagane" (>0)
	quantity: z.coerce.number().min(0.000001, "Ilość musi być większa niż 0"),
	// Alpha/Booster fields (optional)
	conviction: z.number().min(1).max(100).optional().nullable(),
	rationale: z.string().optional().nullable(),
});
