import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { BoosterActionsClient } from "./alpha/BoosterActionsClient";
import type { Category } from "@prisma/client";
import { Progress } from "./ui/progress";
import React from "react";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AlphaLedgerTable({}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/sign-in");

	// 1. FETCH DATA: Get only Booster assets for this user
	const boosterAssets = await db.asset.findMany({
		where: {
			category: "BOOSTER" as Category,
			portfolio: { userId: session.user.id },
		},
		include: { portfolio: true },
		orderBy: { conviction: "desc" },
	});

	return (
		<Table>
			<TableHeader className="bg-muted/30">
				<TableRow className="border-border hover:bg-transparent">
					<TableHead className="font-bold">Aktywo</TableHead>
					<TableHead className="font-bold">Ryzyko</TableHead>
					<TableHead className="font-bold w-48">Przekonanie</TableHead>
					<TableHead className="font-bold">Teza (Skrót)</TableHead>

					{/* NOWA KOLUMNA: WARTOŚĆ (Header 5) */}
					<TableHead className="text-right font-bold">Wartość</TableHead>

					<TableHead className="text-right font-bold">Wynik (ROI)</TableHead>
					<TableHead className="w-12 text-right"></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{boosterAssets.map((asset) => {
					const individualRoi =
						asset.investedCapital > 0
							? ((asset.currentValue - asset.investedCapital) /
									asset.investedCapital) *
								100
							: 0;

					const convictionColor =
						asset.conviction && asset.conviction > 70
							? "bg-emerald-600"
							: "bg-amber-500";

					return (
						<TableRow
							key={asset.id}
							className="border-border hover:bg-muted/20 transition-colors group"
						>
							{/* 1. AKTYWO */}
							<TableCell>
								<div className="font-bold text-sm">{asset.name}</div>
								<div className="text-[10px] text-muted-foreground font-mono bg-muted inline-block px-1.5 py-0.5 rounded mt-0.5">
									{asset.ticker}
								</div>
							</TableCell>

							{/* 2. RYZYKO */}
							<TableCell>
								<div className="flex items-center gap-2">
									<div
										className={cn(
											"h-1.5 w-1.5 rounded-full border border-border shadow-xs",
											convictionColor,
										)}
									/>
									<span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground opacity-90">
										{asset.conviction && asset.conviction > 70
											? "Niskie"
											: "Średnie"}
									</span>
								</div>
							</TableCell>

							{/* 3. PRZEKONANIE */}
							<TableCell>
								<div className="space-y-1.5 pr-4">
									<div className="flex justify-between text-[10px] font-bold text-muted-foreground">
										<span>PEWNOŚĆ</span>
										<span>{asset.conviction}%</span>
									</div>
									<Progress
										value={asset.conviction || 0}
										className="h-1.5 bg-muted"
										indicatorColor={convictionColor}
									/>
								</div>
							</TableCell>

							{/* 4. TEZA */}
							<TableCell className="max-w-40 xl:max-w-64">
								<p className="text-xs text-muted-foreground italic truncate">
									&quot;{asset.rationale || "Brak opisanej tezy..."}
									&quot;
								</p>
							</TableCell>

							{/* 5. NOWA KOMÓRKA: WARTOŚĆ (Wyrównana z Header 5) */}
							<TableCell className="text-right">
								<div className="text-sm font-bold font-mono">
									{asset.currentValue.toLocaleString("pl-PL", {
										minimumFractionDigits: 2,
										maximumFractionDigits: 2,
									})}
									<span className="text-[10px] text-muted-foreground">
										{" "}
										PLN
									</span>
								</div>
								<div className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
									Wkład: {asset.investedCapital}
								</div>
							</TableCell>

							{/* 6. ROI */}
							<TableCell
								className={cn(
									"text-right font-mono font-bold text-sm",
									individualRoi >= 0 ? "text-green-600" : "text-red-500",
								)}
							>
								{individualRoi > 0 && "+"}
								{individualRoi.toFixed(1)}%
							</TableCell>

							{/* 7. AKCJE */}
							<TableCell className="text-right">
								<BoosterActionsClient asset={asset} />
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}
