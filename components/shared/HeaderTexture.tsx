import { cn } from "@/lib/utils";

export function HeaderTexture({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 transition-opacity",
				// Maska zanikania (radial-gradient) przeniesiona prosto do klas Tailwinda
				"mask-[radial-gradient(circle_at_90%_2%,black_5%,transparent_20%)]",
				className,
			)}
		>
			{/* SVG używa 'currentColor', więc pokolorujemy go klasą text-theme-primary! */}
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="100%"
				height="100%"
				className="text-theme-primary"
			>
				<defs>
					<pattern
						id="header-pattern"
						width="100"
						height="100"
						patternUnits="userSpaceOnUse"
					>
						<g stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4">
							<line x1="15" y1="20" x2="15" y2="60" />
							<rect
								x="11"
								y="30"
								width="8"
								height="20"
								fill="currentColor"
								fillOpacity="0.3"
							/>
							<line x1="35" y1="40" x2="35" y2="80" />
							<rect x="31" y="50" width="8" height="15" fill="none" />
							<line x1="55" y1="10" x2="55" y2="45" />
							<rect
								x="51"
								y="15"
								width="8"
								height="25"
								fill="currentColor"
								fillOpacity="0.6"
							/>
							<line x1="75" y1="30" x2="75" y2="70" />
							<rect x="71" y="45" width="8" height="10" fill="none" />
							<line x1="95" y1="50" x2="95" y2="90" />
							<rect
								x="91"
								y="60"
								width="8"
								height="25"
								fill="currentColor"
								fillOpacity="0.2"
							/>
						</g>
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill="url(#header-pattern)" />
			</svg>
		</div>
	);
}
