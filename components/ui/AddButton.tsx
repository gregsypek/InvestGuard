import { cn } from "@/lib/utils";
import { Button } from "./button";

const AddButton = ({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) => {
	return (
		<Button
			size="sm"
			variant="outline"
			className={cn(
				className,
				"h-8 gap-1.5 px-3 font-semibold text-xs uppercase tracking-wide",
				"transition-all duration-200",
				"border-blue-200 dark:border-blue-900/50 text-blue-600 dark:text-blue-400",
				"bg-blue-50 hover:bg-blue-100 dark:hover:bg-blue-900/30 dark:bg-background border-blue-300 dark:border-blue-400",
				"shadow-sm active:scale-95",
			)}
			asChild
		>
			{children}
		</Button>
	);
};

export default AddButton;
