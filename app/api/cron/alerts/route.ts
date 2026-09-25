import { NextResponse } from "next/server";
import { runSmartAlerts } from "@/lib/actions/alerts.actions";

export async function GET(req: Request) {
	// Sprawdzamy, czy request faktycznie pochodzi od Vercela (zabezpieczenie)
	if (
		req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
	) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await runSmartAlerts();
	return NextResponse.json(result);
}
