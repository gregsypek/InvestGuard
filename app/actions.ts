"use server";

export async function addTransaction(formData: FormData) {
	const amount = formData.get("amount");
	const asset = formData.get("asset");

	// Logic to save to database (e.g., Prisma, Supabase)
	console.log(`Zapisano: ${amount} w ${asset}`);

	// Refresh cache
	// revalidatePath('/portfel');
}
