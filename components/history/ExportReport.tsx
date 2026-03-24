"use client";

import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

// 1. Definiujemy kontrakt dla danych eksportu
interface ExportTransaction {
	assetName: string;
	ticker: string | null;
	executedAt: Date | string;
	executedValue: number;
	category: string;
	rationale: string | null;
}

// 2. Podstawiamy typ zamiast any[]
export function ExportReport({ data }: { data: ExportTransaction[] }) {
	const generateMarkdown = () => {
		const header = `# Dziennik Inwestycyjny - Stan na ${new Date().toLocaleDateString()}\n\n`;

		const rows = data
			.map((t) => {
				const notes = t.rationale ? t.rationale.split(" | ") : [];
				const planNote =
					notes.find((n) => n.startsWith("PLAN:"))?.replace("PLAN: ", "") ||
					(notes.length === 1 ? notes[0] : "Brak");
				const execNote = notes
					.find((n) => n.startsWith("REALIZACJA:"))
					?.replace("REALIZACJA: ", "");

				return `### 📦 ${t.assetName} (${t.ticker || "Brak symbolu"})
- **Data:** ${new Date(t.executedAt).toLocaleDateString()}
- **Kwota:** ${t.executedValue.toLocaleString()} PLN
- **Kategoria:** ${t.category}
- **Uzasadnienie planu:** ${planNote}
${execNote ? `- **Notatka z realizacji:** ${execNote}\n` : ""}`;
			})
			.join("\n---\n\n");

		if (typeof window !== "undefined") {
			navigator.clipboard.writeText(header + rows);
			toast.success("Raport z notatkami skopiowany do schowka!");
		}
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={generateMarkdown}
			className="gap-2"
		>
			<ClipboardCopy className="h-4 w-4" /> Eksportuj notatki
		</Button>
	);
}
