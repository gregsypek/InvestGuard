// app/(root)/demo/layout.tsx
import Aside from "@/components/Aside";
import { ChartProvider } from "@/components/providers/ChartProvider";
import HeaderDemo from "@/components/HeaderDemo";

export default function DemoLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ChartProvider initialCurrency="PLN">
			{/* Pudełko wypinające z oryginalnego szkieletu */}
			<div
				className="absolute inset-0 z-50 flex h-screen w-full overflow-hidden bg-background"
				data-theme="emerald"
			>
				<Aside />
				{/* Główny kontener na prawo od paska Aside */}
				<div className="flex flex-col flex-1 min-w-0 bg-t-bg-base relative">
					{/* Pusty portfel przekazywany jako placeholder, właściwy ustali sam Header na bazie URL */}
					<HeaderDemo selectedPortfolioId="" portfolios={[]} />
					{/* Zawartość właściwych podstron */}
					<div className="flex-1 overflow-y-auto">{children}</div>
				</div>
			</div>
		</ChartProvider>
	);
}
