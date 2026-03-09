import AddBondForm from "@/components/ui/assets/AddBondForm";
import { ChevronLeft } from "lucide-react";
import { LibrarySquareIcon } from "lucide-react";
import Link from "next/link";
interface Props {
	params: Promise<{ id: string }>;
}

export default async function AddBondPage({ params }: Props) {
	const { id } = await params;

	return (
		<section className="w-full flex flex-col justify-start md:px-0 overflow-x-hidden">
			<div className="mb-6 flex items-center gap-2 ">
				<Link href={`/bond-reports/${id}`}>
					<div className="pr-2 hover:text-primary cursor-pointer  rounded-full transition-colors">
						<ChevronLeft className="h-6 w-6" />
					</div>
				</Link>
				<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
					{/* <LibrarySquareIcon className="h-6 w-6 text-primary" /> */}
					Formularz dodawania obligacji
				</h2>
			</div>
			<AddBondForm portfolioId={id} />
		</section>
	);
}
