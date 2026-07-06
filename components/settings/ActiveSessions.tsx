"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Globe,
	Laptop,
	Loader2,
	LogOut,
	ShieldAlert,
	Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

// TYMCZASOWE DANE (Mockup) - W przyszłości zastąpimy to danymi z bazy
const mockSessions = [
	{
		id: "1",
		device: "MacBook Pro",
		browser: "Chrome na macOS",
		location: "Warszawa, Polska",
		ip: "192.168.1.44",
		lastActive: "Teraz",
		isCurrent: true,
		type: "desktop",
	},
	{
		id: "2",
		device: "iPhone 13 Pro",
		browser: "Safari na iOS",
		location: "Kraków, Polska",
		ip: "10.0.0.12",
		lastActive: "Wczoraj, 14:32",
		isCurrent: false,
		type: "mobile",
	},
];

export function ActiveSessions() {
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [sessions, setSessions] = useState(mockSessions);

	const handleRevokeOthers = async () => {
		setIsLoading(true);

		// Symulacja akcji serwerowej
		setTimeout(() => {
			setIsLoading(false);
			setIsOpen(false);

			// Usuwamy z listy wszystko poza obecną sesją
			setSessions(sessions.filter((s) => s.isCurrent));

			toast.success("Wylogowano ze wszystkich innych urządzeń.");
		}, 1500);
	};

	const handleRevokeSingle = (id: string) => {
		setSessions(sessions.filter((s) => s.id !== id));
		toast.success("Urządzenie zostało wylogowane.");
	};

	return (
		<>
			<div className="rounded-2xl bg-t-bg-panel border border-t-border-subtle overflow-hidden">
				{/* NAGŁÓWEK SEKCJI */}
				<div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-t-border-subtle/50 bg-black/5 dark:bg-white/5">
					<div>
						<h3 className="text-sm font-bold text-t-text-primary flex items-center gap-2">
							<Globe className="w-4 h-4 text-blue-500" />
							Zalogowane urządzenia
						</h3>
						<p className="text-xs font-medium text-t-text-tertiary mt-1">
							Lista urządzeń, które mają obecnie dostęp do Twojego konta.
						</p>
					</div>

					{sessions.length > 1 && (
						<button
							onClick={() => setIsOpen(true)}
							className="shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-2"
						>
							<LogOut className="w-3.5 h-3.5" />
							Wyloguj inne
						</button>
					)}
				</div>

				{/* LISTA SESJI */}
				<div className="divide-y divide-t-border-subtle/50">
					{sessions.length === 0 ? (
						<div className="p-8 text-center text-t-text-tertiary text-sm">
							Brak aktywnych sesji.
						</div>
					) : (
						sessions.map((session) => (
							<div
								key={session.id}
								className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
							>
								<div className="flex items-start gap-4">
									<div
										className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
											session.isCurrent
												? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
												: "bg-black/5 dark:bg-white/5 border-t-border-subtle text-t-text-tertiary"
										}`}
									>
										{session.type === "desktop" ? (
											<Laptop className="w-5 h-5" />
										) : (
											<Smartphone className="w-5 h-5" />
										)}
									</div>

									<div>
										<div className="flex items-center gap-2">
											<p className="text-sm font-bold text-t-text-primary">
												{session.device}
											</p>
											{session.isCurrent && (
												<span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">
													Obecna sesja
												</span>
											)}
										</div>
										<p className="text-xs font-medium text-t-text-secondary mt-0.5">
											{session.browser} •{" "}
											<span className="text-t-text-tertiary">
												{session.location}
											</span>
										</p>
										<p className="text-[10px] font-medium text-t-text-tertiary mt-1 flex items-center gap-1.5">
											<span className="w-1.5 h-1.5 rounded-full bg-t-border-subtle"></span>
											IP: {session.ip} • Aktywność: {session.lastActive}
										</p>
									</div>
								</div>

								{!session.isCurrent && (
									<button
										onClick={() => handleRevokeSingle(session.id)}
										className="p-2 rounded-lg text-t-text-tertiary hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
										title="Wyloguj urządzenie"
									>
										<LogOut className="w-4 h-4" />
									</button>
								)}
							</div>
						))
					)}
				</div>
			</div>

			{/* MODAL POTWIERDZENIA WYLOGOWANIA INNYCH */}
			<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
				<AlertDialogContent className="bg-t-bg-panel border border-rose-500/20 shadow-2xl shadow-rose-900/20 sm:rounded-2xl max-w-md">
					<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500/0 via-rose-500/50 to-rose-500/0" />

					<div className="p-2">
						<AlertDialogHeader>
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
									<ShieldAlert className="w-5 h-5 text-rose-500" />
								</div>
								<AlertDialogTitle className="text-lg font-black tracking-tight text-t-text-primary">
									Wyloguj z innych urządzeń
								</AlertDialogTitle>
							</div>
							<AlertDialogDescription className="text-sm font-medium text-t-text-tertiary leading-relaxed pt-3">
								Czy na pewno chcesz zakończyć wszystkie sesje na innych
								urządzeniach? Będziesz musiał zalogować się na nich ponownie.
								Obecna sesja pozostanie aktywna.
							</AlertDialogDescription>
						</AlertDialogHeader>

						<AlertDialogFooter className="flex sm:justify-end gap-3 pt-6 border-t border-t-border-subtle mt-5">
							<AlertDialogCancel
								disabled={isLoading}
								className="mt-0 h-11 px-6 rounded-xl border-t-border-subtle bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-t-text-secondary font-bold uppercase tracking-widest text-[10px] transition-colors"
							>
								Anuluj
							</AlertDialogCancel>
							<Button
								onClick={handleRevokeOthers}
								disabled={isLoading}
								className="h-11 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md font-bold uppercase tracking-widest text-[10px] transition-colors flex items-center gap-2"
							>
								{isLoading ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Wylogowywanie...
									</>
								) : (
									"Zakończ inne sesje"
								)}
							</Button>
						</AlertDialogFooter>
					</div>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
