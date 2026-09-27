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
	<section className="flex flex-col py-6 px-4 sm:py-8 md:px-6 lg:py-10">
		<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 lg:gap-6">
			<div className="flex-1 min-w-0">
				<SectionHeader title={title} icon={titleIcon} className="mb-1.5" />
				<SubHeader
					title={subtitle}
					description={description}
					// Brak dolnego paddingu, odstępem zarządza teraz nadrzędny 'gap'
					className="pb-0"
				/>
			</div>

			{action && (
				<div className="shrink-0 self-start xl:self-end w-full sm:w-auto">
					{action}
				</div>
			)}
		</div>

		{/* Zmniejszony i spójny odstęp dla zawartości */}
		<div className="w-full mt-4 md:mt-6">{children}</div>
	</section>
);
