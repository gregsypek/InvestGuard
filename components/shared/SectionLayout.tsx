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
	<section
		className="flex flex-col 
	py-8 px-4 sm:py-10 md:px-6 md:py-12 xl:py-18"
	>
		<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 lg:gap-6">
			<div className="flex-1 min-w-0">
				<SectionHeader title={title} icon={titleIcon} className="mb-2" />
				<SubHeader
					title={subtitle}
					description={description}
					className="pb-2 lg:pb-4"
				/>
			</div>

			{action && (
				<div className="shrink-0 self-end w-full sm:w-auto mb-4">{action}</div>
			)}
		</div>

		<div className="w-full mt-2 md:mt-4">{children}</div>
	</section>
);
