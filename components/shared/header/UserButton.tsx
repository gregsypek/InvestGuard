import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { auth, signOut } from "@/auth";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cookies } from "next/headers"; // <-- Import do zarządzania ciasteczkami na serwerze

const UserButton = async () => {
	const session = await auth();
	if (!session) return null;

	const firstInitial = session.user?.name?.charAt(0).toUpperCase() ?? "U";

	return (
		<div className="flex gap-2 items-center">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="relative w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 hover:bg-blue-500/10 border border-t-border-subtle hover:border-blue-500/30 flex items-center justify-center p-0 transition-all active:scale-95 group"
					>
						<span className="text-t-text-secondary group-hover:text-blue-500 font-bold text-md tracking-tighter transition-colors">
							{firstInitial}
						</span>
						{/* Mała kropka statusu "online" */}
						<span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-t-bg-base rounded-full z-10" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					className="w-56 p-1 rounded-xl shadow-xl bg-t-bg-panel border-t-border"
					align="end"
					forceMount
				>
					<DropdownMenuLabel className="font-normal px-3 py-3">
						<div className="flex flex-col space-y-1 text-left">
							<p className="text-sm font-bold text-t-text-primary leading-none">
								{session.user?.name}
							</p>
							<p className="text-[9px] uppercase tracking-widest font-bold text-t-text-tertiary leading-none mt-1 truncate">
								{session.user?.email}
							</p>
						</div>
					</DropdownMenuLabel>

					<DropdownMenuSeparator className="bg-t-border-subtle" />

					<DropdownMenuItem
						asChild
						className="gap-2 p-2.5 cursor-pointer rounded-lg text-t-text-secondary hover:text-t-text-primary hover:bg-t-hover font-medium text-xs transition-colors"
					>
						<Link href="/profile" className="w-full">
							<User className="h-4 w-4" />
							Profil Inwestora
						</Link>
					</DropdownMenuItem>

					<DropdownMenuSeparator className="bg-t-border-subtle" />

					{/* Wylogowanie za pomocą Server Action */}
					<form
						action={async () => {
							"use server";
							// 1. ZABIJAMY CIASTECZKO ZE STARYM ID PORTFELA!
							const cookieStore = await cookies();
							cookieStore.delete("selectedPortfolioId");

							// 2. Wylogowujemy użytkownika i wymuszamy powrót na stronę główną
							await signOut({ redirectTo: "/" });
						}}
						className="w-full"
					>
						<button className="w-full flex items-center gap-2 p-2.5 cursor-pointer rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-medium text-xs transition-colors outline-none">
							<LogOut className="h-4 w-4" />
							Wyloguj się
						</button>
					</form>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default UserButton;
