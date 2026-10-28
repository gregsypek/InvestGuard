"use client";

import { Camera, Maximize2, Minimize2, Wallet2 } from "lucide-react";
import React, { useRef, useState } from "react";

import { APP_NAME } from "@/lib/constants";
import { ChartContainer } from "./ChartContainer";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export interface ChartCardLayoutProps {
	title?: string;
	subtitle?: string;
	icon?: React.ElementType;
	controls?: React.ReactNode;
	headerExtra?: React.ReactNode;
	topOverlay?: React.ReactNode;
	footer?: React.ReactNode;
	children: React.ReactNode;
}

export function ChartCardLayout({
	title,
	subtitle,
	icon: Icon = Wallet2,
	controls,
	headerExtra,
	topOverlay,
	footer,
	children,
}: ChartCardLayoutProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const chartRef = useRef<HTMLDivElement>(null);

	const handleDownload = async () => {
		if (!chartRef.current) return;
		const toastId = toast.loading("Generating screenshot...");
		try {
			const bgColor = document.documentElement.classList.contains("dark")
				? "#0f172a"
				: "#ffffff";
			const dataUrl = await toPng(chartRef.current, {
				cacheBust: true,
				backgroundColor: bgColor,
				pixelRatio: 2,
				filter: (node) => {
					if (node?.classList?.contains("recharts-brush")) return false;
					return true;
				},
			});
			const link = document.createElement("a");
			link.download = `InvestGuard-${format(new Date(), "yyyy-MM-dd")}.png`;
			link.href = dataUrl;
			link.click();
			toast.success("Chart saved as image.", { id: toastId });
		} catch (err) {
			console.error("Screenshot error:", err);
			toast.error("Failed to create image. Try again.", { id: toastId });
		}
	};

	const renderHeaderControls = () => (
		<div className="flex flex-col px-6 z-20 mb-2 sm:mb-4 w-full gap-3">
			<div className="flex flex-col items-center md:flex-row justify-between w-full">
				{(title || subtitle) && (
					<div className="flex justify-between flex-col md:items-start items-center pb-2 mx-auto pointer-events-none bg-transparent rounded-lg">
						{!isExpanded && title && (
							<h3 className="text-md font-bold text-t-text-primary">{title}</h3>
						)}
						{subtitle && (
							<p
								className={cn(
									"text-xs flex-1 self-center sm:self-end font-semibold text-t-text-tertiary mt-1 leading-tight",
									!isExpanded && "whitespace-pre-wrap text-[10px]",
								)}
							>
								{subtitle}
							</p>
						)}
					</div>
				)}
				<div
					className={cn(
						"flex flex-wrap items-center gap-2 w-full md:justify-end",
						isExpanded ? "justify-end" : "justify-center",
					)}
				>
					{controls}
					<div className="w-px h-5 bg-t-border mx-1 hidden sm:block" />
					<div className="flex items-center gap-1">
						<button
							onClick={handleDownload}
							className="flex items-center gap-1.5 px-1 xl:px-3 py-1 xl:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer text-slate-400 border-slate-700/60 hover:text-slate-600 hover:border-slate-400"
						>
							<Camera className="w-4 h-4" />
						</button>
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className={cn(
								"flex items-center gap-1.5 px-1 xl:px-3 py-1 xl:py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border hover:cursor-pointer",
								isExpanded
									? "bg-theme-soft text-theme-primary border-theme-border shadow-sm hover:opacity-80 brightness-75"
									: "text-slate-400 border-slate-700/60 hover:text-slate-600 hover:border-slate-400",
							)}
							title={isExpanded ? "Collapse chart" : "Expand chart"}
						>
							{isExpanded ? (
								<Minimize2 className="w-4 h-4" />
							) : (
								<Maximize2 className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>
			</div>
			{headerExtra && <div>{headerExtra}</div>}
		</div>
	);

	const chartContent = (
		<ChartContainer className="h-full min-h-0 w-full flex-1 relative flex flex-col">
			<div className="flex">
				<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 xl:top-[-8px] xl:left-5 xl:translate-x-0 xl:translate-y-0 w-auto xl:w-full pointer-events-none z-0 opacity-15 dark:opacity-10">
					<div className="flex items-center justify-center xl:justify-start gap-2 grayscale">
						<div className="w-24 h-24 xl:w-12 xl:h-12 rounded-xl flex items-center justify-center">
							<Image
								src="/logo-static.svg"
								alt="Logo"
								width={96}
								height={96}
								className="block dark:hidden object-contain w-24 h-24 xl:w-8 xl:h-8"
							/>
							<Image
								src="/logo-light-static.svg"
								alt="Logo"
								width={96}
								height={96}
								className="hidden dark:block object-contain w-24 h-24 xl:w-8 xl:h-8"
							/>
						</div>
						<span className="text-xl font-black tracking-tighter hidden xl:inline-block transition-colors text-t-text-primary">
							{APP_NAME}.
						</span>
					</div>
				</div>
				{topOverlay && (
					<div className="md:justify-end justify-center flex flex-wrap w-full gap-2">
						{topOverlay}
					</div>
				)}
			</div>
			<div className="relative z-10 h-full w-full [&_*:focus]:outline-none flex flex-col">
				{children}
			</div>
		</ChartContainer>
	);

	if (isExpanded) {
		return (
			<div className="fixed inset-0 z-[100] bg-t-bg-base/95 backdrop-blur-xl p-6 md:p-12 flex flex-col animate-in fade-in duration-200">
				<div
					className="pointer-events-none absolute inset-0 opacity-40"
					style={{
						background:
							"radial-gradient(circle at 15% 10%, var(--theme-soft), transparent 45%)",
					}}
				/>
				<div
					ref={chartRef}
					className="relative flex flex-col flex-1 min-h-0 w-full rounded-2xl p-2 md:p-4 bg-t-bg-base/30"
				>
					<div className="relative flex flex-col items-center justify-between sm:flex-row sm:items-start mb-6">
						<div className="flex items-start gap-3 flex-col">
							<div className="flex">
								<div className="p-2 rounded-xl h-full bg-blue-500/10 border-blue-500/20 hidden sm:block">
									<Icon className="w-5 h-5 text-blue-500" />
								</div>
								<h3 className="lg:text-xl flex-1 self-center text-md font-bold text-t-text-primary tracking-tight">
									{title || "Chart Details"}
								</h3>
							</div>
							<p className="text-xs flex-1 sm:text-sm text-t-text-secondary hidden sm:block">
								Detailed capital analysis and history
							</p>
						</div>
						{renderHeaderControls()}
					</div>
					<div className="relative flex-1 min-h-0 bg-t-bg-panel border border-t-border rounded-2xl p-4 shadow-xl flex flex-col">
						<div className="flex-1 w-full bg-t-bg-panel rounded-lg pb-2 pt-2 relative">
							{chartContent}
						</div>
						{footer && (
							<div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3 pt-3 border-t border-t-border overflow-x-auto pb-1">
								{footer}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={chartRef}
			className="relative w-full h-full flex flex-col group bg-t-bg-panel p-2 rounded-xl"
		>
			{renderHeaderControls()}
			<div className="flex-1 w-full min-h-0 relative z-10 bg-t-bg-panel rounded-lg pt-2 pb-2 pr-2">
				{chartContent}
			</div>
			{footer && (
				<div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-3 pt-3 sm:px-6 border-t border-t-border overflow-x-auto pb-1">
					{footer}
				</div>
			)}
		</div>
	);
}

// ============================================================================
// 🚀 REUSABLE CHART PILLS (Etykiety dla wykresów Recharts)
// ============================================================================

export const SingleValuePill = (props: any) => {
	const { x, y, value, index, customProps } = props;
	if (!customProps || x == null || y == null || value == null) return null;

	const { brushEndIndex, mode, currencySymbol, convertPLN } = customProps;
	console.log({ index, brushEndIndex, value });
	if (index !== brushEndIndex) return null;

	const isPercentage = mode === "PERCENTAGE";
	const displayValue = isPercentage
		? `${value > 0 ? "+" : ""}${value.toFixed(2)}%`
		: `${new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }).format(convertPLN(value))} ${currencySymbol}`;

	const rectWidth = Math.max(
		isPercentage ? 60 : 70,
		displayValue.length * 7 + 16,
	);
	const rectHeight = 22;

	return (
		<g style={{ outline: "none" }}>
			<line
				x1={x}
				y1={y}
				x2={x - 12}
				y2={y}
				stroke="var(--theme-primary)"
				strokeWidth={1.5}
				strokeDasharray="2 2"
			/>
			<rect
				x={x - 12 - rectWidth}
				y={y - rectHeight / 2}
				width={rectWidth}
				height={rectHeight}
				rx={6}
				fill="var(--theme-primary)"
			/>
			<text
				x={x - 12 - rectWidth / 2}
				y={y + 3.5}
				textAnchor="middle"
				fill="#fff"
				fontSize={10}
				fontWeight="bold"
			>
				{displayValue}
			</text>
			<circle
				cx={x}
				cy={y}
				r={4}
				fill="var(--theme-primary)"
				stroke="var(--t-bg-panel)"
				strokeWidth={2}
			/>
		</g>
	);
};
