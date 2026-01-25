export { auth as middleware } from "@/auth";

export const config = {
	// protected routes
	matcher: ["/booster/:path*", "/raporty/:path*"],
};
