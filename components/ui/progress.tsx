"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

// EN: Extend props to include optional indicatorColor
const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
		indicatorColor?: string; // UI: Dodajemy nowy prop
	}
>(({ className, value, indicatorColor, ...props }, ref) => (
	<ProgressPrimitive.Root
		ref={ref}
		className={cn(
			"relative h-4 w-full overflow-hidden rounded-full bg-secondary",
			className,
		)}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className="h-full w-full flex-1 bg-primary transition-all rounded-xl"
			style={{
				transform: `translateX(-${100 - (value || 0)}%)`,
				// EN: Apply custom color if provided, otherwise fallback to class style
				// UI: Nadpisujemy kolor tła, jeśli podano indicatorColor
				backgroundColor: indicatorColor,
			}}
		/>
	</ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
