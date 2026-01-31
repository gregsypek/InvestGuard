import { CategoryStatus } from "@/lib/types";
import PortfolioPieChart from "./PortfolioPieChart";

interface Props {
	data: CategoryStatus[];
}

export default function PortfolioCharts({ data }: Props) {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<PortfolioPieChart
				data={data}
				title="Target Strategy"
				dataKey="weight"
			/>
			<PortfolioPieChart
				data={data}
				title="Current Allocation"
				dataKey="actualPercentage"
			/>
		</div>
	);
}
