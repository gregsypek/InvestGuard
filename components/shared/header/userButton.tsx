import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth, signOut } from "@/auth";

import { Button } from "@/components/ui/button";
import Link from "next/link";

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
						className="relative w-9 h-9 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center p-0 transition-all active:scale-95"
					>
						<span className="text-blue-600 dark:text-blue-400 font-bold text-md tracking-tighter">
							{firstInitial}
						</span>
						{/* EN: Small online status dot */}
						{/* PL: Mała kropka statusu "online" */}
						<span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">
								{session.user?.name}
							</p>
							<p className="text-xs text-muted-foreground leading-none">
								{session.user?.email}
							</p>
						</div>
					</DropdownMenuLabel>

					<DropdownMenuItem asChild>
						<Link href="/user/profile" className="w-full cursor-pointer">
							Profil Inwestora
						</Link>
					</DropdownMenuItem>

					{/* EN: Sign out using a Server Action */}
					{/* PL: Wylogowanie za pomocą Server Action */}
					<form
						action={async () => {
							"use server";
							await signOut();
						}}
						className="w-full"
					>
						<button className="relative flex w-full select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer">
							Wyloguj się
						</button>
					</form>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default UserButton;
