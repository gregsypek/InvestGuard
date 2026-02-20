import { Wallet2 } from "lucide-react";

type Props = {
	name: string;
	totalValue: number;
	customBreadcrumbs?: React.ReactNode; // Tu wstrzykniemy Twój kod
};
export const DashboardHeader = ({
	name,
	totalValue,
	customBreadcrumbs,
}: Props) => {
	return (
		<header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
			<div>
				{customBreadcrumbs ? (
					customBreadcrumbs
				) : (
					<nav className="text-sm text-muted-foreground mb-2 italic">
						Dashboard / <span className="text-primary font-medium">{name}</span>
					</nav>
				)}
				<div>
					<h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
						{name}
					</h1>
					<p className="text-muted-foreground font-medium mt-1">
						Zarządzaj wybranym portfelem i kontroluj jego strategie
					</p>
				</div>
			</div>

			<div className="flex gap-3 ">
				<div className="bg-card  border-border2 p-3 rounded-xl flex items-center gap-3  text-blue-500 border ">
					<div className="p-2 bg-primary/10 rounded-lg">
						<Wallet2 className="text-primary h-5 w-5" />
					</div>
					<div className="">
						<p className="text-[10px] uppercase text-muted-foreground font-bold">
							Total Value
						</p>
						<p className="text-lg font-bold ">
							{totalValue.toLocaleString()} PLN
						</p>
					</div>
				</div>
			</div>
		</header>
	);
};
