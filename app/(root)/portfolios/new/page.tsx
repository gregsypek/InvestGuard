import PortfolioForm from "@/components/PortfolioForm";
import React from "react";

// In Next.js Page components, searchParams are provided automatically as a prop
interface Props {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const New = async ({ searchParams }: Props) => {
	// Await searchParams because they are a Promise in newer Next.js versions
	const sParams = await searchParams;
	const portfolioId = sParams.portfolioId as string | undefined;

	return (
		<div>
			{/* Passing the portfolioId to the form as a prop */}
			<PortfolioForm portfolioId={portfolioId} />
		</div>
	);
};

export default New;
