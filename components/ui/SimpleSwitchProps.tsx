import { cn } from "@/lib/utils";

interface SimpleSwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	className?: string;
}

export function SimpleSwitch({
	checked,
	onChange,
	className,
}: SimpleSwitchProps) {
	return (
		<button
			type="button"
			onClick={() => onChange(!checked)}
			className={cn(
				"relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out outline-none border-2 border-transparent",
				// Używamy naszych nowych zmiennych
				checked ? "bg-foreground" : "bg-switch-off",
				className,
			)}
		>
			<span
				className={cn(
					"pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out",
					// Przesunięcie
					checked ? "translate-x-5" : "translate-x-0.5",
				)}
			/>
		</button>
	);
}
