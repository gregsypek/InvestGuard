interface MarketRowProps {
	name: string;
	value: string;
	isPositive: boolean;
	logo?: string | null;
}

export function MarketRow({ name, value, isPositive, logo }: MarketRowProps) {
	return (
		<div className="flex items-center justify-between group py-1">
			<div className="flex items-center gap-3">
				{/* === KONTENER NA LOGO === */}
				{logo ? (
					<div className="w-6 h-6 rounded-full overflow-hidden shrink-0  flex items-center justify-center shadow-sm">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={logo}
							alt={name}
							className="w-full h-full object-cover p-0.5 rounded-full"
						/>
					</div>
				) : (
					<div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
						{/* Fallback - jeśli nie ma logo, pokazujemy pierwszą literę nazwy */}
						<span className="text-[10px] font-black text-blue-500">
							{name.charAt(0)}
						</span>
					</div>
				)}

				{/* NAZWA */}
				<span className="text-xs font-bold text-t-text-secondary group-hover:text-t-text-primary transition-colors">
					{name}
				</span>
			</div>

			{/* WARTOŚĆ (Zmiana procentowa) */}
			<span
				className={`text-xs font-black tracking-wider ${
					value === "0.00%"
						? "text-t-text-tertiary"
						: isPositive
							? "text-emerald-500"
							: "text-rose-500"
				}`}
			>
				{value}
			</span>
		</div>
	);
}
