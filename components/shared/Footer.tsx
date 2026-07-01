import { APP_NAME } from "@/lib/constants";
import { Button } from "../ui/button";
import DesktopNav from "./DesktopNav";
import { Globe } from "lucide-react";
import { Input } from "../ui/input";
import Link from "next/link";

function Footer() {
	return (
		<footer className="relative z-10 w-full border-t border-t-border bg-t-bg-panel pt-20 pb-10 px-4 rounded-t-3xl">
			<div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
				{/* Kolumna 1: Marka & Newsletter */}
				<div className="md:col-span-2 space-y-6">
					<h3 className="text-xl font-black text-t-text-primary tracking-tight">
						{APP_NAME}
					</h3>
					<p className="text-t-text-secondary text-sm max-w-sm leading-relaxed">
						Dołącz do inwestorów, którzy optymalizują swoje portfele na wyższym
						poziomie. Zapisz się na newsletter, aby otrzymywać informacje o
						nowych funkcjach i integracjach.
					</p>
					<div className="flex gap-2 max-w-sm">
						<Input
							type="email"
							placeholder="Twój adres email"
							className="bg-black/5 dark:bg-black/30 border-t-border focus-visible:ring-blue-500 h-10 text-xs text-t-text-primary"
						/>
						<Button className="bg-blue-600 hover:bg-blue-500 text-white h-10 px-6 font-bold uppercase tracking-widest text-[10px] border-0">
							Zapisz
						</Button>
					</div>
				</div>

				{/* Kolumna 2: Szybkie Linki */}
				<div className="flex flex-col space-y-4">
					<h4 className="text-[10px] font-black uppercase tracking-widest text-t-text-tertiary mb-2">
						Platforma
					</h4>
					<Link
						href="/dashboard"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Dashboard
					</Link>
					<Link
						href="/planner"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Kalkulatory & Planner
					</Link>
					<Link
						href="/demo"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Wersja Demo
					</Link>
					<Link
						href="#"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Dokumentacja API
					</Link>
				</div>

				{/* Kolumna 3: Prawne & Ustawienia */}
				<div className="flex flex-col space-y-4">
					<h4 className="text-[10px] font-black uppercase tracking-widest text-t-text-tertiary mb-2">
						Zasoby
					</h4>
					<Link
						href="#"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Polityka Prywatności
					</Link>
					<Link
						href="#"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Regulamin
					</Link>
					<Link
						href="#"
						className="text-sm text-t-text-secondary hover:text-blue-500 transition-colors"
					>
						Kontakt & Wsparcie
					</Link>
				</div>
			</div>

			{/* Dolny pasek (Copyright & Przełączniki) */}
			<div className="max-w-6xl mx-auto pt-8 border-t border-t-border-subtle flex flex-col md:flex-row justify-between items-center gap-6">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-widest text-t-text-tertiary text-center md:text-left">
						&copy; 2026 {APP_NAME}. Wszelkie prawa zastrzeżone.
					</p>
					{/* <p className="text-[8px] font-bold  tracking-widest text-t-text-tertiary text-center md:text-left">
							project created by gregsypek.
						</p> */}
				</div>

				<div className="flex items-center gap-4">
					{/* Przyszły przełącznik języka */}
					<button className="flex items-center gap-2 text-t-text-tertiary hover:text-t-text-primary transition-colors text-xs font-bold uppercase tracking-widest">
						<Globe className="w-4 h-4" /> PL
					</button>
					<div className="w-px h-4 bg-t-border" />
					{/* Przyszły przełącznik motywu (już masz ciemny, to na przyszłość) */}
					{/* <button className="flex items-center gap-2 text-t-text-tertiary hover:text-t-text-primary transition-colors text-xs font-bold uppercase tracking-widest"> */}
					{/* <Moon className="w-4 h-4" /> Dark */}
					<DesktopNav />
					{/* </button> */}
				</div>
			</div>
		</footer>
	);
}

export default Footer;
