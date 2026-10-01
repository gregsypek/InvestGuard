import { LucideIcon } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { SubHeader } from "./SubHeader";

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
	// 🚀 ZASTOSOWANA KLASA: .section-padding
	<section className="flex flex-col section-padding w-full ">
		{/* Prawidłowe podejście Mobile-First: domyślnie kolumna (flex-col), na dużych ekranach (xl:) wiersz */}
		<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 lg:gap-6">
			<div className="flex-1 min-w-0">
				<SectionHeader title={title} icon={titleIcon} className="mb-1.5" />
				<SubHeader
					title={subtitle}
					description={description}
					className="pb-0"
				/>
			</div>

			{action && (
				<div className="shrink-0 self-end  sm:w-auto mt-2 xl:mt-0 ">
					{action}
				</div>
			)}
		</div>

		<div className="w-full content-mt">{children}</div>
	</section>
);
