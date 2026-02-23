import { signIn } from "@/auth";
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";

export default function SignInPage() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
			<div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl">
				<div className="text-center">
					<h1 className="font-bold text-xl text-bold-900 tracking-tight hidden md:inline-block">
						{APP_NAME}
						<span className="text-blue-500">.</span>
					</h1>
					<p className="mt-2 text-sm text-gray-600">
						Zaloguj się, aby zarządzać swoimi portfelami
					</p>
				</div>

				<form
					action={async () => {
						"use server";
						await signIn("google", { redirectTo: "/dashboard" });
					}}
				>
					<button
						type="submit"
						className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:shadow-md"
					>
						<Image
							src="https://authjs.dev/img/providers/google.svg"
							alt="Google logo"
							className="h-5 w-5"
							width={20}
							height={20}
						/>
						Zaloguj przez Google
					</button>
				</form>

				<p className="text-center text-xs text-gray-400">
					Twoje dane są bezpieczne dzięki autoryzacji Google
				</p>
			</div>
		</div>
	);
}
