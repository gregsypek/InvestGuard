"use client";

import { EyeIcon, EyeOff, Pause, Play, Settings2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";

const rates = [
	{ label: "USD/PLN", value: "4.02", change: "+0.12%" },
	{ label: "EUR/PLN", value: "4.35", change: "-0.05%" },
	{ label: "GOLD", value: "2350", change: "+1.20%" },
	{ label: "S&P 500", value: "6570", change: "+0.45%" },
	{ label: "WIG20", value: "2450", change: "-0.30%" },
];

export function MarketTicker() {
	const [speed, setSpeed] = useState(30);
	const [isVisible, setIsVisible] = useState(true);
	const [isPaused, setIsPaused] = useState(false);
	const [showControls, setShowControls] = useState(false);

	return (
		<div
			className={cn(
				"relative group w-full bg-secondary/30 border-b border-border overflow-hidden select-none transition-all duration-300",
				isVisible ? "py-1.5 h-9" : "  h-9 py-1.5 bg-transparent border-none",
			)}
		>
			{/* PASEK Z KURSAMI - teraz widoczny tylko gdy isVisible jest true */}
			{isVisible && (
				<div
					className="flex whitespace-nowrap"
					style={{
						animation: isPaused ? "none" : `marquee ${speed}s linear infinite`,
						display: "inline-flex",
					}}
				>
					{[...rates, ...rates, ...rates].map((item, idx) => (
						<div
							key={idx}
							className="flex items-center px-10 gap-3 border-r border-border/50"
						>
							<span className="text-[10px] font-bold text-muted-foreground uppercase">
								{item.label}
							</span>
							<span className="text-sm font-mono font-bold tracking-tighter text-foreground">
								{item.value}
							</span>
							<span
								className={`text-[10px] font-bold ${item.change.startsWith("+") ? "text-emerald-500" : "text-rose-500"}`}
							>
								{item.change}
							</span>
						</div>
					))}
				</div>
			)}

			{/* KONTROLKI - Pojawiają się TYLKO na hover (opacity-0 -> group-hover:opacity-100) */}
			<div className="absolute right-0 top-0 h-full flex items-center gap-1 px-4 bg-gradient-to-l from-background via-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				{/* Rozszerzony panel prędkości - pojawia się po kliknięciu zębatki */}
				{showControls && isVisible && (
					<div className="flex items-center gap-4 bg-card border border-border p-2 rounded-lg shadow-lg mr-2 animate-in fade-in slide-in-from-right-2">
						<div className="flex flex-col gap-1 w-24">
							<span className="text-[9px] uppercase font-black text-muted-foreground">
								Tempo
							</span>
							<Slider
								value={[60 - speed]}
								max={55}
								min={5}
								step={1}
								onValueChange={(val) => setSpeed(60 - val[0])}
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

				{/* Przycisk ustawień - widoczny tylko gdy pasek jest rozwinięty */}
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

				{/* Przycisk Pokaż/Ukryj - zawsze dostępny na hover by przywrócić pasek */}
				<Button
					variant={isVisible ? "secondary" : "default"}
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
