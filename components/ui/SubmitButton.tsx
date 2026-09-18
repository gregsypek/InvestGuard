import { Hourglass, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
	label: string;
	isLoading?: boolean;
	disabled?: boolean;
	className?: string;
	icon?: React.ReactNode;
}

export function SubmitButton({
	label,
	isLoading,
	disabled,
	className,
	icon,
}: SubmitButtonProps) {
	// Przycisk będzie zablokowany, jeśli ALBO hook wykryje wysyłkę, ALBO podamy isLoading ręcznie
	const { pending } = useFormStatus();

	// Przycisk jest zablokowany, jeśli formularz się wysyła LUB nie przeszedł walidacji
	const isDisabled = isLoading || disabled || pending;

	return (
		<Button
			type="submit"
			disabled={isDisabled}
			className={cn(
				"font-bold transition-all duration-300 active:scale-95 shadow-sm rounded-2xl",

				// 🚀 ZMIANA: Solidne tło w kolorze motywu, biały tekst i elegancki "glow" przy hoverze
				"bg-[color-mix(in_srgb,var(--theme-primary),black_20%)] text-white hover:opacity-90 hover:shadow-[0_4px_20px_var(--theme-soft)] cursor-pointer",

				// Obsługa zablokowanego stanu (neutralna szarość)
				"disabled:bg-t-bg-base disabled:text-t-text-tertiary disabled:border-t-border disabled:shadow-none disabled:opacity-70 disabled:cursor-not-allowed",
				className,
			)}
		>
			{isDisabled ? (
				<div className="px-6 flex items-center">
					{/* Używamy statycznej ikony zamiast animacji dla lepszego UX/A11y */}
					<Hourglass className="mr-2 h-4 w-4" />
					Uzupełnij dane...
				</div>
			) : (
				<>
					{icon || <Save className="mr-2 h-4 w-4" />}
					{label}
				</>
			)}
		</Button>
	);
}
