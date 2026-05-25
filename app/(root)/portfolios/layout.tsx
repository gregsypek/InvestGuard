// app/(root)/portfolios/layout.tsx
// import { db } from "@/lib/db";
// import { getGlobalStats } from "@/lib/calculations";

export default async function PortfoliosLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Fetch all portfolios to calculate global stats
	// const portfolios = await db.portfolio.findMany({
	// 	include: { assets: true },
	// });

	// const stats = getGlobalStats(portfolios);

	// We pass the calculated stats through props if needed,
	// but for now, the Header will be managed inside individual pages
	// or right here if you want it constant.

	return <main className="space-y-10">{children}</main>;
}
