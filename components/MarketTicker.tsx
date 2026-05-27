"use client";

import { EyeIcon, EyeOff, Pause, Play, Settings2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { TickerIcon } from "./TickerIcon";
import { cn } from "@/lib/utils";

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
	const [speed, setSpeed] = useState(200);
	const [isVisible, setIsVisible] = useState(true);
	const [isPaused, setIsPaused] = useState(false);
	const [showControls, setShowControls] = useState(false);

	if (!data || data.length === 0) return null;

	return (
		<div
			className={cn(
				// Tło #05070a (niemal czarne), brak jasnych borderów, cienka linia na dole border-white/5
				"relative group w-full bg-[#05070a] text-slate-300 border-b border-white/5 overflow-hidden select-none transition-all duration-300",
				isVisible ? "py-1.5 h-9" : "h-9 py-1.5 bg-transparent border-none",
			)}
		>
			{isVisible && (
				<div
					className="flex whitespace-nowrap"
					style={{
						animation: isPaused ? "none" : `marquee ${speed}s linear infinite`,
						display: "inline-flex",
					}}
				>
					{[...data, ...data, ...data].map((item, index) => {
						// Logika kolorowania liczb w tickerze
						const changeStr = String(item.change);
						const isPositive =
							changeStr.startsWith("+") ||
							(!changeStr.startsWith("-") && parseFloat(changeStr) > 0);
						const isNegative = changeStr.startsWith("-");

						return (
							<div
								key={index}
								className="flex items-center space-x-2.5 mx-6 text-[11px] font-medium tracking-wide"
							>
								{item.logo ? (
									<TickerIcon ticker={item.label} logoUrl={item.logo} />
								) : (
									<div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
										{item.label[0]}
									</div>
								)}

								<span className="text-slate-400 uppercase">{item.label}</span>
								<span className="font-mono text-slate-200">{item.value}</span>
								<span
									className={cn(
										"font-mono font-bold",
										isPositive
											? "text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]"
											: isNegative
												? "text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]"
												: "text-slate-500",
									)}
								>
									{item.change}
								</span>
							</div>
						);
					})}
				</div>
			)}

			<div className="absolute right-0 top-0 h-full flex items-center gap-1 px-4 bg-linear-to-l from-background via-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				{showControls && isVisible && (
					<div className="flex items-center gap-4 bg-card border border-border p-2 rounded-lg shadow-lg mr-2 animate-in fade-in slide-in-from-right-2">
						<div className="flex flex-col gap-1 w-24">
							<span className="text-[9px] uppercase font-black text-muted-foreground">
								Tempo
							</span>
							<Slider
								value={[200 - speed]}
								max={80}
								min={5}
								step={1}
								onValueChange={(val) => setSpeed(200 - val[0])}
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
						className="h-7 w-7 rounded-full bg-background border border-border shadow-sm"
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
