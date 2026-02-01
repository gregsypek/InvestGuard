"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

/**
 * Custom Submit Button component
 * Handles loading states and theme adaptation automatically
 */
export function SubmitButton({ label }: { label: string }) {
	// Hook to detect if the parent form is currently submitting
	const { pending } = useFormStatus();

	return (
		<Button
			type="submit"
			disabled={pending}
			className="w-full md:w-auto font-semibold transition-all duration-200 active:scale-95 cursor-pointer hover:scale-95"
		>
			{pending ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Processing...
				</>
			) : (
				<>
					<Plus className="mr-2 h-4 w-4 " />
					{label}
				</>
			)}
		</Button>
	);
}
