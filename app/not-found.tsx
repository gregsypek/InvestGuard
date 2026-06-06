import PortfolioEmptyState from "@/components/PortfolioEmptyState";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
			<PortfolioEmptyState variant="NOT_FOUND" />
		</div>
	);
}
