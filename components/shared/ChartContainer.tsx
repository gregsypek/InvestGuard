"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function ChartContainer({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => {
			const { width, height } = entry.contentRect;
			setSize({ width, height });
		});
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const isReady = size.width > 0 && size.height > 0;

	return (
		<div ref={ref} className={cn("min-h-0 min-w-0", className)}>
			{isReady ? (
				children
			) : (
				<div className="w-full h-full animate-pulse bg-slate-800/10 rounded-xl" />
			)}
		</div>
	);
}
