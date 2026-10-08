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
	const { pending } = useFormStatus();

	// Przycisk jest zablokowany, jeśli formularz się wysyła LUB nie przeszedł walidacji
	const isDisabled = isLoading || disabled || pending;

	return (
		<Button
			type="submit"
			disabled={isDisabled}
			className={cn(
				"font-bold transition-all duration-300 rounded-2xl flex items-center justify-center gap-2",

				// 🚀 STAN AKTYWNY (Zastosowany tylko gdy NIE jest zablokowany)
				!isDisabled &&
					"bg-[color-mix(in_srgb,var(--theme-primary),black_10%)] text-white hover:opacity-90 hover:shadow-[0_4px_20px_var(--theme-soft)] cursor-pointer active:scale-95 shadow-sm",

				// 🚀 STAN ZABLOKOWANY (Otrzymuje twarde granice, żeby nadal wyglądał jak przycisk)
				isDisabled &&
					"bg-black/5 dark:bg-white/5 text-t-text-tertiary border border-t-border-subtle shadow-none opacity-70 cursor-not-allowed",

				className,
			)}
		>
			{isDisabled ? (
				<>
					<Hourglass className="h-4 w-4" />
					<span>
						{isLoading || pending ? "Zapisywanie..." : "Uzupełnij dane"}
					</span>
				</>
			) : (
				<>
					{icon || <Save className="h-4 w-4" />}
					<span>{label}</span>
				</>
			)}
		</Button>
	);
}
