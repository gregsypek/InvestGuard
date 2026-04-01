import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
	interface Session {
		user: {
			id: string;
			role: Role;
		} & DefaultSession["user"];
	}

	interface User {
		role: Role;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		id?: string;
		role?: Role;
	}
}

// 🆕 To rozwiąże błąd "Property 'role' is missing in AdapterUser"
declare module "@auth/core/adapters" {
	interface AdapterUser {
		role: Role;
	}
}
