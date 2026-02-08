import { Target } from "lucide-react";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

type Props = {
	progress: number;
	remaining: number;
	goal: number;
};
const DashboardGoal = ({ progress, remaining, goal }: Props) => {
	return (
		<section className="bg-card border border-border2 p-6 rounded-2xl shadow-sm">
			<div className="flex justify-between items-end mb-4">
				<div>
					<div className="flex items-center gap-2 text-primary mb-1">
						<Target className="h-4 w-4" />
						<span className="text-sm font-bold uppercase tracking-wider">
							Goal Progress
						</span>
					</div>
					<p className="text-2xl font-black">{progress.toFixed(1)}%</p>
				</div>
				<div className="text-right">
					<p className="text-sm text-muted-foreground italic">
						{remaining > 0
							? `Only ${remaining.toLocaleString()} PLN to reach your goal!`
							: "Goal achieved! 🚀"}
					</p>
					<p className="text-xs font-medium text-muted-foreground">
						Target: {goal.toLocaleString()} PLN
					</p>
				</div>
			</div>
			<Progress
				value={Math.min(progress, 100)}
				className={cn("h-3 shadow-inner", progress > 100 && "bg-blue-500/50")}
			/>
		</section>
	);
};

export default DashboardGoal;
