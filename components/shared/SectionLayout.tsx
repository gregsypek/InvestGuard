// --- WEWNĘTRZNY KOMPONENT LAYOUTU (GWARANCJA SPÓJNOŚCI) ---
// Ten komponent sprawia, że wszystkie marginesy, linie podziału i nagłówki

import { LucideIcon } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { SubHeader } from "./SubHeader";

// są idealnie takie same we wszystkich sekcjach. Koniec z bałaganem w klasach!
interface SectionLayoutProps {
	title: string;
	titleIcon?: LucideIcon;
	subtitle: string;
	description: string;
	subtitleIcon?: React.ElementType;
	action?: React.ReactNode;
	children: React.ReactNode;
}

export const SectionLayout = ({
	title,
	titleIcon,
	subtitle,
	description,
	action,
	children,
}: SectionLayoutProps) => (
	// ZMIANA: border-white/5 -> border-t-border
	<section className="flex flex-col gap-5 md:gap-6 py-10 md:py-12 xl:py-18  p-2 md:p-4 ">
		<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
			<div>
				<SectionHeader title={title} icon={titleIcon} className="mb-2" />
				<SubHeader
					title={subtitle}
					description={description}
					className="pb-4"
				/>
			</div>
			{action && <div className="shrink-0 sm:mb-1 self-end">{action}</div>}
		</div>
		<div className="w-full">{children}</div>
	</section>
);
