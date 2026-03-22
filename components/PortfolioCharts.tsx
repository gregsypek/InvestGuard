import { CategoryStatus } from "@/lib/types";
import PortfolioPieChart from "./PortfolioPieChart";

interface Props {
	data: CategoryStatus[];
}

export default function PortfolioCharts({ data }: Props) {
	const filteredData = data.filter((x) => x.weight > 0);

	return (
		<div className="grid lg:grid-cols-2 gap-6 items-stretch ">
			<PortfolioPieChart
				data={filteredData}
				// title="Target Strategy"
				title="Docelowa Strategia"
				dataKey="weight"
			/>
			<PortfolioPieChart
				data={filteredData}
				// title="Current Allocation"
				title="Aktualna Strategia"
				dataKey="actualPercentage"
			/>
		</div>
	);
}
