"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// EN: Extend props to include optional indicatorColor
const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
		indicatorColor?: string;
	}
>(({ className, value, indicatorColor, ...props }, ref) => {
	// Sprawdzamy, czy przekazany kolor to zmienna CSS lub hex (zaczyna się od var lub #)
	const isRawColor =
		indicatorColor?.startsWith("var") || indicatorColor?.startsWith("#");

	return (
		<ProgressPrimitive.Root
			ref={ref}
			className={cn(
				"relative h-4 w-full overflow-hidden rounded-full bg-secondary border border-border",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				className={cn(
					"h-full w-full flex-1 transition-all rounded-xl",
					// Jeśli to nie jest surowy kolor, traktujemy to jako klasę (np. bg-blue-500)
					!isRawColor && (indicatorColor || "bg-primary"),
				)}
				style={{
					transform: `translateX(-${100 - (value || 0)}%)`,
					// Jeśli to jest surowy kolor (var lub hex), wrzucamy go do style
					backgroundColor: isRawColor ? indicatorColor : undefined,
				}}
			/>
		</ProgressPrimitive.Root>
	);
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
