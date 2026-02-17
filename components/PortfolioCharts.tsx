import { CategoryStatus } from "@/lib/types";
import PortfolioPieChart from "./PortfolioPieChart";

interface Props {
	data: CategoryStatus[];
}

export default function PortfolioCharts({ data }: Props) {
	const filteredData = data.filter((x) => x.weight > 0);

	console.log("🚀 ~ PortfolioCharts ~ data:", data);
	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<PortfolioPieChart
				data={filteredData}
				title="Target Strategy"
				dataKey="weight"
			/>
			<PortfolioPieChart
				data={filteredData}
				title="Current Allocation"
				dataKey="actualPercentage"
			/>
		</div>
	);
}
