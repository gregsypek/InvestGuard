"use client";

import { Loader2, Trash2 } from "lucide-react";
import { forwardRef, useTransition } from "react";

import { ActionResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DeleteButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	id: string;
	onDelete: (id: string) => Promise<ActionResponse>;
	confirmMsg: string;
	label?: string; // EN: Optional text label / UI: Opcjonalna etykieta tekstowa
	isDemo?: boolean;
}

export const DeleteButton = forwardRef<HTMLButtonElement, DeleteButtonProps>(
	({ id, onDelete, confirmMsg, label, isDemo, className, ...props }, ref) => {
		const [isPending, startTransition] = useTransition();

		const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
			// EN: If the menu passed an onClick, we should call it too
			// UI: Jeśli menu przekazało onClick, wypadałoby je też wywołać
			props.onClick?.(e);

			e.preventDefault();
			e.stopPropagation();

			if (isDemo) {
				toast.error("Akcja zablokowana", {
					description: "Usuwanie jest wyłączone w trybie demo.",
				});
				return;
			}

			if (confirm(confirmMsg)) {
				startTransition(async () => {
					const result = await onDelete(id);
					if (result && result.success) {
						toast.success("Usunięto!");
					} else {
						toast.error(result.error || "Nie można usunąć");
					}
				});
			}
		};

		return (
			<button
				ref={ref}
				{...props}
				disabled={isPending}
				onClick={handleDelete}
				// EN: Using cn() to merge external and internal classes
				// UI: Używamy cn(), aby połączyć zewnętrzne i wewnętrzne klasy
				className={cn(
					"p-2 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 group cursor-pointer",
					className,
				)}
				title="Delete"
			>
				{isPending ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Trash2 className="h-4 w-4 transition-colors group-hover:scale-110" />
				)}

				{label && <span>{label}</span>}
			</button>
		);
	},
);

// EN: Adding display name is a good practice for forwardRef components
// UI: Dodanie displayName to dobra praktyka przy komponentach forwardRef
DeleteButton.displayName = "DeleteButton";
