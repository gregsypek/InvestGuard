// app/(root)/layout.tsx
import Aside from "@/components/Aside";
import Header from "@/components/Header";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen overflow-hidden bg-background">
			{/* Sidebar*/}
			<Aside />
			<div className="flex flex-col flex-1 min-w-0">
				<Header />
				{/* scrollable main part */}
				<main className="flex-1 overflow-y-auto p-4 md:p-8">
					<div className="max-w-7xl mx-auto">{children}</div>
				</main>
			</div>
		</div>
	);
}
