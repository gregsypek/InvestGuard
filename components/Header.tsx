"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Menu from "./shared/Menu";

import Cookies from "js-cookie";
// Define what data the Header component needs
interface HeaderProps {
	portfolios: { id: string; name: string }[];
	userButton: React.ReactNode;
	selectedPortfolioId: string; // Dodajemy to jako prop
}
export default function Header({
	portfolios = [],
	userButton,
	selectedPortfolioId,
}: HeaderProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const currentId = searchParams.get("portfolioId");

	const handlePortfolioChange = (id: string) => {
		// 1. Zapisujemy w ciasteczku, żeby serwer wiedział o tym przy następnym wejściu
		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });

		// 2. Zmieniamy URL - to spowoduje, że Next.js "przerenderuje" komponenty
		// Jeśli ID jest puste, możemy usunąć parametr z URL
		if (id) {
			router.push(`/dashboard?portfolioId=${id}`);
		} else {
			router.push(`/dashboard`);
		}
	};

	// Wyliczamy wartość, którą select ma wyświetlić "tu i teraz"
	const displayValue =
		searchParams.get("portfolioId") || currentId || selectedPortfolioId || "";
	return (
		<header className="flex justify-between items-center p-2  border-border  bg-background text-foreground border-b">
			{/* <h1 className="text-xl font-bold">My Wallets</h1> */}
			<div className="px-5  ">
				<select
					value={displayValue} // Select zawsze pokazuje to, co wynika z logiki powyżej
					onChange={(e) => handlePortfolioChange(e.target.value)}
					className="p-2 border rounded-md bg-background"
				>
					<option value="">All Portfolios</option>
					{portfolios?.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
			</div>
			<div className="px-5  ">
				{/* Przekazujemy przycisk użytkownika do Menu */}
				<Menu userButton={userButton} />
			</div>
		</header>
	);
}
