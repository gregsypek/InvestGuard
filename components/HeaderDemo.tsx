"use client";

import { GraduationCap, LogOut } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

import Cookies from "js-cookie";
import Link from "next/link";

const DEMO_OPTIONS = [
	{ id: "demo-classic", name: "Demo: Klasyczny 60/40", key: "classic" },
	{ id: "demo-dalio", name: "Demo: Ray Dalio", key: "dalio" },
	{ id: "demo-yale", name: "Demo: Model Yale", key: "yale" },
];

interface HeaderDemoProps {
	portfolios: { id: string; name: string }[];
	selectedPortfolioId: string;
}

export default function HeaderDemo({
	portfolios = [],
	selectedPortfolioId,
}: HeaderDemoProps) {
	const handlePortfolioChange = (id: string) => {
		const demo = DEMO_OPTIONS.find((d) => d.id === id);
		if (demo) {
			window.location.href = `/demo?s=${demo.key}`;
			return;
		}
		// Normalna ścieżka (wyjście z demo)
		Cookies.set("selectedPortfolioId", id, { expires: 30, path: "/" });
		window.location.href = `/dashboard/${id}`;
	};

	return (
		<div className="sticky top-0 z-50 w-full flex flex-col">
			{/* Główny pasek Demo */}
			<div className="bg-emerald-600 border-b border-emerald-500 text-white flex justify-between items-center p-2">
				<div className="px-5 flex items-center gap-3">
					<Select
						value={selectedPortfolioId}
						onValueChange={handlePortfolioChange}
					>
						<SelectTrigger className="w-64 font-bold text-[11px] uppercase tracking-widest h-9 border-none bg-white/10 hover:bg-white/20 text-white focus:ring-0">
							<div className="flex items-center gap-2 overflow-hidden">
								<GraduationCap className="h-4 w-4 shrink-0" />
								<div className="truncate text-left">
									<SelectValue placeholder="Wybierz portfel demo..." />
								</div>
							</div>
						</SelectTrigger>
						<SelectContent>
							<div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
								Portfele Demo
							</div>
							{DEMO_OPTIONS.map((d) => (
								<SelectItem
									key={d.id}
									value={d.id}
									className="text-emerald-600 font-semibold"
								>
									{d.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="px-5 flex items-center gap-4">
					<Link
						href="/dashboard"
						className="flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 px-4 py-2 rounded-full text-white hover:bg-white/30 transition-all"
					>
						<LogOut className="h-3.5 w-3.5" />
						Opuść Demo
					</Link>
				</div>
			</div>

			{/* Cienki pasek "Educational" */}
			<div className=" text-white/90 text-[9px] text-center font-bold uppercase tracking-[0.3em] py-2 bg-background">
				Tryb Edukacyjny • Przeglądasz portfel wzorcowy • Edycja zablokowana
			</div>
		</div>
	);
}
