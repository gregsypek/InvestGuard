import { CategoryStatus } from "@/lib/types";
import PortfolioPieChart from "./PortfolioPieChart";

interface Props {
	data: CategoryStatus[];
}

export default function PortfolioCharts({ data }: Props) {
	// 1. Zbiór dla "Docelowej Strategii" - pokazuje tylko to, co zaplanowaliśmy (weight > 0)
	const targetData = data.filter((x) => x.weight > 0);

	// 2. Zbiór dla "Aktualnej Strategii" - pokazuje tylko to, w co fizycznie zainwestowaliśmy kapitał
	const actualData = data.filter((x) => x.actualPercentage > 0);
	return (
		<div className="grid lg:grid-cols-2 gap-6 items-stretch ">
			<PortfolioPieChart
				data={targetData}
				title="Docelowa Strategia"
				dataKey="weight"
			/>
			<PortfolioPieChart
				data={actualData}
				title="Aktualna Strategia"
				dataKey="actualPercentage"
			/>
		</div>
	);
}
