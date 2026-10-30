"use client";

import { ZIndexLayer, usePlotArea } from "recharts";

export const THEME_COLORS: Record<string, string> = {
	blue: "#3b82f6",
	indigo: "#6366f1",
	violet: "#8b5cf6",
	purple: "#a855f7",
	fuchsia: "#d946ef",
	pink: "#ec4899",
	emerald: "#10b981",
	teal: "#14b8a6",
	cyan: "#06b6d4",
	sky: "#0ea5e9",
	amber: "#f59e0b",
	orange: "#f97316",
	lime: "#84cc16",
	slate: "#64748b",
	red: "#ef4444",
	rose: "#f43f5e",
	green: "#22c55e",
	yellow: "#eab308",
	zinc: "#71717a",
	stone: "#78716c",
};

const PILL_HEIGHT = 22;
const PILL_GAP = 4;
const PILL_STEP = PILL_HEIGHT + PILL_GAP;
const PILL_MIN_WIDTH = 65;

export interface PillItem {
	id: string;
	color: string;
	value: number;
	index: number; // indeks względem widocznego zakresu Brusha
}

/**
 * Rozstawia etykiety w osi Y tak, by się nie nakładały.
 * Zwraca finalne pozycje Y (środek pigułki) w tej samej kolejności co `targets`.
 */
function spreadLabels(
	targets: number[],
	step: number,
	lo: number,
	hi: number,
): number[] {
	const order = targets
		.map((_, i) => i)
		.sort((a, b) => targets[a] - targets[b]);

	const place = (ids: number[]) => {
		const mean = ids.reduce((s, i) => s + targets[i], 0) / ids.length;
		const span = (ids.length - 1) * step;
		const top = Math.min(
			Math.max(mean - span / 2, lo),
			Math.max(lo, hi - span),
		);
		return { ids, top };
	};

	let clusters = order.map((i) => place([i]));

	let merged = true;
	while (merged) {
		merged = false;
		for (let c = 1; c < clusters.length; c++) {
			const prev = clusters[c - 1];
			const cur = clusters[c];
			const prevBottom = prev.top + (prev.ids.length - 1) * step;
			if (cur.top - prevBottom < step - 0.01) {
				clusters = [
					...clusters.slice(0, c - 1),
					place([...prev.ids, ...cur.ids]),
					...clusters.slice(c + 1),
				];
				merged = true;
				break;
			}
		}
	}

	const result = new Array<number>(targets.length).fill(0);
	clusters.forEach((cl) =>
		cl.ids.forEach((id, k) => {
			result[id] = cl.top + k * step;
		}),
	);
	return result;
}

interface EndPillsProps {
	pills: PillItem[];
	count: number; // liczba punktów w widocznym zakresie
	domain: [number, number];
	mode: "VALUE" | "PERCENTAGE";
	currencySymbol: string;
	convertPLN: (v: number) => number;
}

export function EndPills({
	pills,
	count,
	domain,
	mode,
	currencySymbol,
	convertPLN,
}: EndPillsProps) {
	const plot = usePlotArea();
	if (!plot || !Number.isFinite(plot.width) || !Number.isFinite(plot.height))
		return null;
	const [dMin, dMax] = domain;
	const range = dMax - dMin || 1;
	const yOf = (v: number) => plot.y + ((dMax - v) / range) * plot.height;
	const xOf = (i: number) =>
		count > 1 ? plot.x + (i / (count - 1)) * plot.width : plot.x + plot.width;

	const items = pills.map((p) => {
		const label =
			mode === "PERCENTAGE"
				? `${p.value > 0 ? "+" : ""}${p.value.toFixed(2)}%`
				: `${new Intl.NumberFormat("pl-PL", {
						notation: "compact",
						maximumFractionDigits: 1,
					}).format(convertPLN(p.value))} ${currencySymbol}`;
		return { ...p, x: xOf(p.index), y: yOf(p.value), label };
	});

	const finalYs = spreadLabels(
		items.map((i) => i.y),
		PILL_STEP,
		plot.y + PILL_HEIGHT / 2,
		plot.y + plot.height - PILL_HEIGHT / 2,
	);

	return (
		<ZIndexLayer zIndex={2000}>
			<g style={{ pointerEvents: "none" }}>
				{items.map((it, k) => {
					const fy = finalYs[k];
					const w = Math.max(PILL_MIN_WIDTH, it.label.length * 7 + 16);
					return (
						<g key={it.id}>
							<path
								d={`M ${it.x} ${it.y} C ${it.x - 10} ${it.y}, ${it.x - 10} ${fy}, ${it.x - 16} ${fy}`}
								stroke={it.color}
								strokeWidth={1.5}
								strokeDasharray="2 2"
								fill="none"
							/>
							<rect
								x={it.x - 16 - w}
								y={fy - PILL_HEIGHT / 2}
								width={w}
								height={PILL_HEIGHT}
								rx={6}
								fill={it.color}
								fillOpacity={0.7}
								stroke="var(--t-bg-panel)"
								strokeWidth={2}
							/>
							<text
								x={it.x - 16 - w / 2}
								y={fy + 3.5}
								textAnchor="middle"
								fill="#fff"
								fontSize={10}
								fontWeight="bold"
							>
								{it.label}
							</text>
							<circle
								cx={it.x}
								cy={it.y}
								r={4}
								fill={it.color}
								stroke="var(--t-bg-panel)"
								strokeWidth={2}
							/>
						</g>
					);
				})}
			</g>
		</ZIndexLayer>
	);
}
