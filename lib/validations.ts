import { z } from "zod";

// Definicja stałych opcji dla horyzontu czasowego
export const TIME_HORIZONS = [
	{ value: "SHORT", label: "Krótki (< 1 rok)" },
	{ value: "MEDIUM", label: "Średni (1-3 lata)" },
	{ value: "LONG", label: "Długi (> 3 lata)" },
] as const;

export const BoosterSchema = z.object({
	name: z.string().min(1, "Nazwa jest wymagana"),
	ticker: z.string().optional().nullable(), // Pole opcjonalne
	value: z.coerce.number().positive("Wartość musi być dodatnia"),
	timeHorizon: z.enum(["SHORT", "MEDIUM", "LONG"]),
	rationale: z.string().min(5, "Uzasadnienie powinno być nieco dłuższe"),
});
