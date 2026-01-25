import { z } from "zod";

export const TransactionSchema = z.object({
	assetName: z.string().min(2, "Nazwa musi mieć min. 2 znaki"),
	amount: z.number().positive("Kwota musi być większa od 0"),
	risk: z.number().min(0).max(5, "Ryzyko musi być w skali 0-5"),
	rationale: z.string().min(10, "Opisz krótko, dlaczego to kupujesz"),
});
