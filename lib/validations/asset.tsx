import * as z from "zod";

export const AddAssetSchema = z.object({
	portfolioId: z.string().min(1),
	category: z.string().min(1),
	ticker: z.string().min(1),
	name: z.string().min(1),
	quantity: z.number().min(0.00001, "Ilość musi być dodatnia"),
	investedCapital: z.number().min(0.01, "Wkład musi być dodatni"),
	// Pola Alpha (Opcjonalne)
	conviction: z.number().min(1).max(100).optional().nullable(),
	rationale: z.string().optional().nullable(),
});
