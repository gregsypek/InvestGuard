"use client";
// EN: Local component for inline adjustment logic

import { CheckCheck, X } from "lucide-react";

import { ActionResponse } from "@/lib/types";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

// UI: Lokalny komponent do logiki szybkiej korekty
const QuickAdjustCell = ({
	currentValue,
	assetId,
	onUpdate, // Dodamy propa do wywołania akcji serwerowej
	label = "Koryguj wycenę", // <--- DODANY PROP Z DOMYŚLNĄ WARTOŚCIĄ
}: {
	currentValue: number;
	assetId: string;
	onUpdate: (id: string, newValue: number) => Promise<ActionResponse>;
	label?: string; // <--- DODANY TYP
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const [inputValue, setInputValue] = useState("");

	const newValue = parseFloat(inputValue);
	// Walidacja: wartość musi być liczbą i nie może być ujemna
	const isInvalid = isNaN(newValue) || newValue < 0;

	if (!isEditing) {
		return (
			<Button
				variant="outline"
				className="text-[10px] h-7 px-2 font-mono hover:bg-primary/10 border-dashed"
				onClick={() => {
					setIsEditing(true);
					setInputValue(currentValue.toString()); // Startujemy od obecnej ceny
				}}
			>
				{label} {/* <--- UŻYWAMY PROPA */}
			</Button>
		);
	}

	return (
		<div className="flex flex-col gap-1 items-center">
			<div className="flex items-center gap-1">
				<input
					autoFocus
					type="number"
					className={cn(
						"w-24 bg-background border rounded px-1.5 py-1 text-xs font-mono focus:outline-none",
						isInvalid ? "border-destructive" : "border-primary",
					)}
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
				/>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-green-600"
					disabled={isInvalid}
					onClick={async () => {
						await onUpdate(assetId, newValue);
						setIsEditing(false);
					}}
				>
					<CheckCheck className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7"
					onClick={() => setIsEditing(false)}
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};
export default QuickAdjustCell;
