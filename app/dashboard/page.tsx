// app/dashboard/page.tsx
import ComparisonBars from "@/app/portfel/components/ComparisonBars";
import { db } from "@/lib/db";
import PortfolioTableBeauty from "../portfel/components/PortfolioTableBeauty";
import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import AssetsTable from "../portfel/components/AssetsTable";

export default async function DashboardPage() {
	// Fetch all assets from Vercel Postgres via Prisma
	const assets = await db.asset.findMany();
	console.log("🚀 ~ DashboardPage ~ assets:", assets);

	return (
		<div className="container mx-auto p-6 space-y-8">
			<header>
				<h1 className="text-3xl font-bold text-slate-900">Portfolio Booster</h1>
				<p className="text-slate-500">Real-time data from Vercel Postgres</p>
			</header>

			<AddAssetForm />
			{/* Passing real database data  */}
			{/* <CategoryHealthTable assets={assets} /> */}
			<AssetsTable assets={assets} />
			<div className="grid gap-6">
				<h2 className="text-xl font-semibold">Category Health</h2>
				<PortfolioTableBeauty assets={assets} />
			</div>
			<ComparisonBars assets={assets} />
		</div>
	);
}
