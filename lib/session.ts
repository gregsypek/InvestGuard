import { cookies } from "next/headers";

// EN: This stays strictly on the server side
// UI: To zostaje wyłącznie po stronie serwera
export async function getActivePortfolioId(
	searchParams?: Promise<{ portfolioId?: string }>,
) {
	const params = searchParams ? await searchParams : {};
	const urlId = params.portfolioId;

	const cookieStore = await cookies();
	const cookieId = cookieStore.get("selectedPortfolioId")?.value;

	return urlId || cookieId || null;
}
