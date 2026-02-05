"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

/**
 * Custom Submit Button component
 * Handles loading states and theme adaptation automatically
 */
export function SubmitButton({
	label,
	isLoading,
}: {
	label: string;
	isLoading?: boolean;
}) {
	// Przycisk będzie zablokowany, jeśli ALBO hook wykryje wysyłkę, ALBO podamy isLoading ręcznie
	const { pending } = useFormStatus();
	const isWorking = pending || isLoading;
	return (
		<Button
			type="submit"
			disabled={isWorking}
			className="w-full md:w-auto font-semibold transition-all border duration-200 active:scale-95 cursor-pointer hover:border-border2 bg-blue-400"
		>
			{isWorking ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					Processing...
				</>
			) : (
				<>
					{/* <Plus className="mr-2 h-4 w-4 " /> */}
					{label}
				</>
			)}
		</Button>
	);
}
