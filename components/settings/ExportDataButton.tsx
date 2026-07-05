"use client";

import { Download, Loader2 } from "lucide-react";

import { exportUserData } from "@/app/actions/user";
import { toast } from "sonner";
import { useState } from "react";

export function ExportDataButton() {
	const [isLoading, setIsLoading] = useState(false);

	const handleExport = async () => {
		setIsLoading(true);
		try {
			// 1. Pobieramy dane z naszej nowej akcji serwerowej
			const data = await exportUserData();

			// 2. Zamieniamy obiekt na ładnie sformatowany tekst JSON
			const jsonString = JSON.stringify(data, null, 2);

			// 3. Tworzymy wirtualny plik w pamięci przeglądarki
			const blob = new Blob([jsonString], { type: "application/json" });
			const url = URL.createObjectURL(blob);

			// 4. Tworzymy niewidoczny link i "klikamy" go, by wymusić pobieranie
			const a = document.createElement("a");
			a.href = url;
			a.download = `invest-guard-export-${new Date().toISOString().split("T")[0]}.json`;
			document.body.appendChild(a);
			a.click();

			// 5. Sprzątamy po sobie
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			toast.success("Dane zostały pobrane na Twój dysk.");
		} catch (error) {
			console.error("Błąd eksportu:", error);
			toast.error("Wystąpił problem podczas eksportowania danych.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<button
			onClick={handleExport}
			disabled={isLoading}
			className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-t-border-subtle rounded-lg text-xs font-bold text-t-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
		>
			{isLoading ? (
				<Loader2 className="w-4 h-4 animate-spin" />
			) : (
				<Download className="w-4 h-4" />
			)}
			{isLoading ? "Przygotowywanie..." : "Pobierz dane"}
		</button>
	);
}

//NOTE: Unia Europejska wprowadziła prawo (RODO / GDPR), które nazywa się "Prawem do przenoszenia danych".
// Mówi ono, że użytkownik nie może być "zakładnikiem" aplikacji. Musi mieć prawo w dowolnym momencie kliknąć jeden przycisk i pobrać wszystkie swoje dane, które wygenerował, w czytelnym formacie maszynowym (najczęściej jest to plik .json lub .csv), aby móc je np. zaimportować do Excela, innej aplikacji, albo po prostu zachować na dysku jako kopię zapasową.
