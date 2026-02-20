import { PlannerList } from "@/components/planner/PlannerList";
import { db } from "@/lib/db";
import PlannerForm from "./PlannerForm";

export default async function PlannerPage() {
	const portfolios = await db.portfolio.findMany();

	return (
		<div className="p-8 space-y-10">
			<section>
				<h2 className="text-2xl font-bold mb-4">Nowy Plan Inwestycyjny</h2>
				<PlannerForm portfolios={portfolios} />
			</section>

			<hr />

			<section>
				<h2 className="text-2xl font-bold mb-4">Oczekujące Realizacje</h2>
				<PlannerList />
			</section>
		</div>
	);
}
