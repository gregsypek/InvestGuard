"use client";

import Link from "next/link";

export function LoginButton() {
	return (
		<Link
			href="/sign-in"
			className="flex items-center gap-3 px-4 py-2 bg-background hover:bg-muted/50 transition-all rounded-md text-[11px] font-bold uppercase tracking-widest shadow-sm hover:cursor-pointer"
		>
			Zaloguj się
		</Link>
	);
}
