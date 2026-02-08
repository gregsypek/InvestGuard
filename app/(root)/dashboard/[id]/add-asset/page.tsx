import AddAssetForm from "@/components/ui/assets/AddAssetForm";
import { Library, LibrarySquareIcon } from "lucide-react";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function AddAssetPage({ params }: Props) {
	// Pobieramy id z parametrów ścieżki
	const { id } = await params;

	return (
		<section className="w-full flex flex-col justify-start  md:px-0 overflow-x-hidden">
			<div className=" mb-4">
				<h2 className="h2-bold flex items-center gap-2">
					<LibrarySquareIcon className="h-5 w-5 text-primary" /> Add Asset Form
				</h2>
			</div>
			<AddAssetForm portfolioId={id} />
		</section>
	);
}
