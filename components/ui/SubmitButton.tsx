"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

/**
 * Custom Submit Button component
 * Handles loading states and theme adaptation automatically
 */
export function SubmitButton({
	label,
	isLoading,
	disabled,
	className,
}: {
	label: string;
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
}) {
	// Przycisk będzie zablokowany, jeśli ALBO hook wykryje wysyłkę, ALBO podamy isLoading ręcznie
	const { pending } = useFormStatus();

	// 3. Przycisk jest nieaktywny, gdy pracuje LUB gdy wymusimy to przez props
	const isDisabled = pending || isLoading || disabled;
	return (
		<Button
			type="submit"
			disabled={isDisabled}
			className={`w-full  font-semibold transition-all border duration-200 active:scale-95 cursor-pointer hover:border-border2 bg-blue-400 ${className || ""}`}
		>
			{isDisabled ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 " />
					Uzupełnij dane ...
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
