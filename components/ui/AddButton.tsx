import { Button } from "./button";
import { cn } from "@/lib/utils";

const AddButton = ({
	children,
	className,
	disabled,
}: {
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
}) => {
	return (
		<Button
			size="sm"
			disabled={disabled}
			className={cn(
				className,
				" md:w-auto h-10 px-8 rounded-2xl font-bold uppercase text-[10px] tracking-widest bg-blue-400  text-xs shadow-blue-600/20 ",
			)}
			asChild
		>
			{children}
		</Button>
	);
};

export default AddButton;
