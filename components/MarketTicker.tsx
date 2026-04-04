"use client";

import { EyeIcon, EyeOff, Pause, Play, Settings2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { TickerIcon } from "./TickerIcon";
import { cn } from "@/lib/utils";

// Definicja typu dla pojedynczego elementu paska
interface TickerItem {
	label: string;
	value: string | number;
	change: string | number;
	logo?: string | null;
}

interface MarketTickerProps {
	data: TickerItem[];
}

export function MarketTicker({ data }: MarketTickerProps) {
	console.log("🚀 ~ MarketTicker ~ data:", data);
	const [speed, setSpeed] = useState(100);
	const [isVisible, setIsVisible] = useState(true);
	const [isPaused, setIsPaused] = useState(false);
	const [showControls, setShowControls] = useState(false);

	// Jeśli nie ma danych, nie renderujemy paska
	if (!data || data.length === 0) return null;

	return (
		<div
			className={cn(
				"relative group w-full border-b transition-all duration-300 select-none flex items-center z-50 ",
				isVisible
					? "h-9 bg-secondary/30 border-border overflow-hidden "
					: "h-2 bg-transparent border-transparent hover:bg-secondary/10",
			)}
		>
			{/* PASEK Z KURSAMI */}
			<div
				className={cn(
					"flex whitespace-nowrap transition-opacity duration-300 ",
					isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
				)}
				style={{
					animation: isPaused ? "none" : `marquee ${speed}s linear infinite`,
					display: "inline-flex",
				}}
			>
				{/* Powielamy dane 3x dla płynności zapętlenia */}
				{[...data, ...data, ...data].map((item, idx) => {
					return (
						<div
							key={idx}
							className="flex items-center px-10 gap-3 border-r border-border/50 "
						>
							{/* LOGO LUB LITERA (Fallback) */}
							<div className="flex items-center justify-center w-5 h-5 shrink-0">
								{item.logo ? (
									<TickerIcon ticker={item.label} logoUrl={item.logo} />
								) : (
									<div className="w-full h-full rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
										{item.label[0]}
									</div>
								)}
							</div>

							<div className="flex flex-col ">
								<span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
									{item.label}
								</span>
								<span className="text-[10px] font-mono font-bold tracking-tighter text-foreground">
									{item.value}
								</span>
							</div>

							<span
								className={cn(
									"text-[10px] font-bold px-1.5 py-0.5 rounded",
									String(item.change).startsWith("+")
										? "text-emerald-500 bg-emerald-500/10"
										: "text-rose-500 bg-rose-500/10",
								)}
							>
								{item.change}
							</span>
						</div>
					);
				})}
			</div>

			{/* KONTROLKI (Pojawiają się na hover) */}
			<div className="absolute right-0 inset-y-0 flex items-center gap-1 px-4 bg-linear-to-l from-background via-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
				{showControls && isVisible && (
					<div className="flex items-center gap-4 bg-card border border-border p-2 rounded-lg shadow-lg mr-2 animate-in fade-in slide-in-from-right-2">
						<div className="flex flex-col gap-1 w-24">
							<span className="text-[9px] uppercase font-black text-muted-foreground">
								Tempo
							</span>
							<Slider
								value={[120 - speed]}
								max={60}
								min={10}
								step={1}
								onValueChange={(val) => setSpeed(120 - val[0])}
							/>
						</div>
						<div className="h-6 w-px bg-border" />
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onClick={() => setIsPaused(!isPaused)}
						>
							{isPaused ? (
								<Play className="h-4 w-4 fill-current" />
							) : (
								<Pause className="h-4 w-4 fill-current" />
							)}
						</Button>
					</div>
				)}

				{isVisible && (
					<Button
						variant="secondary"
						size="icon"
						className="h-7 w-7 rounded-full bg-background border shadow-sm"
						onClick={() => setShowControls(!showControls)}
					>
						<Settings2
							className={cn(
								"h-3.5 w-3.5 transition-transform",
								showControls && "rotate-90",
							)}
						/>
					</Button>
				)}

				<Button
					variant="secondary"
					size="icon"
					className="h-7 w-7 rounded-full shadow-sm"
					onClick={() => {
						setIsVisible(!isVisible);
						if (isVisible) setShowControls(false);
					}}
				>
					{isVisible ? (
						<EyeOff className="h-3.5 w-3.5" />
					) : (
						<EyeIcon className="h-3.5 w-3.5" />
					)}
				</Button>
			</div>

			<style jsx global>{`
				@keyframes marquee {
					0% {
						transform: translateX(0);
					}
					100% {
						transform: translateX(-33.33%);
					}
				}
			`}</style>
		</div>
	);
}
