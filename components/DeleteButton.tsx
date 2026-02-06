"use client";

import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTransition } from "react";
import { ActionResponse } from "@/lib/types";

interface DeleteButtonProps {
	id: string;
	onDelete: (id: string) => Promise<ActionResponse>;
	confirmMsg: string;
}

export function DeleteButton({ id, onDelete, confirmMsg }: DeleteButtonProps) {
	const [isPending, startTransition] = useTransition();

	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault(); // Bardzo ważne: zatrzymuje nawigację linku!
		e.stopPropagation(); // Zatrzymuje bąbelkowanie do karty

		if (confirm(confirmMsg)) {
			startTransition(async () => {
				const result = await onDelete(id);
				// Sprawdzamy, czy success jest dokładnie równe true
				if (result && result.success === true) {
					toast.success("Success!");
				} else {
					toast.error(result.error || "An error occurred");
				}
			});
		}
	};

	return (
		<button
			onClick={handleDelete}
			disabled={isPending}
			className="p-2 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 group cursor-pointer"
			title="Delete"
		>
			{isPending ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<Trash2 className="h-4 w-4 transition-colors group-hover:scale-110" />
			)}
		</button>
	);
}
