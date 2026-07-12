import z from "zod";

// NOTE: preprocess  rzutuje wejscie na unknown - błedy typescript
// export const PortfolioSchema = z.object({
// 	name: z.string().min(1, "Nazwa portfela jest wymagana"),
// 	description: z.string().optional().nullable(),
// 	goal: z.preprocess(
// 		// If string is empty, treat as undefined to allow optionality
// 		(val) => (val === "" ? undefined : val),
// 		z.coerce.number().positive("Purpose must be a positive number").optional(),
// 	),
// });
export const PortfolioSchema = z.object({
	name: z.string().min(1, "Nazwa portfela jest wymagana"),
	description: z.string().optional().nullable(),
	// goal: z
	// 	.union([z.string(), z.number()])
	// 	.optional()
	// 	.transform((val) => {
	// 		if (val === "" || val === undefined || val === null) return undefined;
	// 		const num = typeof val === "string" ? parseFloat(val) : val;
	// 		return isNaN(num) ? undefined : num;
	// 	})
	// 	.refine((val) => val === undefined || val > 0, {
	// 		message: "Purpose must be a positive number",
	// 	}),
	goal: z
		.union([z.string(), z.number()])
		.optional()
		.transform((val) => (val === "" || val == null ? undefined : Number(val)))
		.pipe(z.number().positive("Purpose must be a positive number").optional()),
	// Nowe pola strategii
	targetDeveloped: z.coerce.number().min(0).max(100).default(0),
	targetEmerging: z.coerce.number().min(0).max(100).default(0),
	targetBonds: z.coerce.number().min(0).max(100).default(0),
	targetGold: z.coerce.number().min(0).max(100).default(0),
	targetBooster: z.coerce.number().min(0).max(100).default(0),
	targetCash: z.coerce.number().min(0).max(100).default(0),
	targetCrypto: z.coerce.number().min(0).max(100).default(0),
	targetCommodities: z.coerce.number().min(0).max(100).default(0),
	// 🚀 NOWE:
	targetRealEstate: z.coerce.number().min(0).max(100).default(0),
	targetCustom: z.coerce.number().min(0).max(100).default(0),
});

// THIS IS KEY: Export the type inferred from the schema
export type PortfolioFormValues = z.infer<typeof PortfolioSchema>;
