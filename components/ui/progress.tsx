import { cn } from "@/lib/utils";

interface SimpleProgressProps {
	value?: number;
	className?: string;
	indicatorColor?: string; // ⬅️ Dodajemy nowy opcjonalny prop
}

function Progress({
	value = 0,
	className,
	indicatorColor,
}: SimpleProgressProps) {
	const safeValue = Math.min(100, Math.max(0, value));

	return (
		<div
			className={cn(
				"w-full h-3 bg-zinc-200 rounded-full overflow-hidden shadow-inner",
				className,
			)}
		>
			<div
				className={cn(
					"h-full transition-all duration-500 ease-in-out rounded-xl",
					// 💡 Jeśli indicatorColor nie zostanie podany, użyjemy domyślnego gradientu
					indicatorColor
						? indicatorColor
						: "bg-linear-to-r from-blue-600 to-cyan-600",
				)}
				style={{ width: `${safeValue}%` }}
			/>
		</div>
	);
}
export { Progress };
