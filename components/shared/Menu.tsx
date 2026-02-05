import { EllipsisVertical } from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import ModeToggle from "./header/ModeToggle";
// import UserButton from "./header/userButton";
interface MenuProps {
	// Definiujemy prop jako React.ReactNode, aby mógł przyjąć dowolny komponent
	userButton: React.ReactNode;
}
const Menu = ({ userButton }: MenuProps) => {
	return (
		<div className="flex justify-end gap-3">
			<nav className="hidden md:flex w-full max-w-xs gap-1">
				<ModeToggle />
				{/* Zamiast <UserButton />, używamy propa */}
				{userButton}
			</nav>
			<nav className="md:hidden ">
				<Sheet>
					<SheetTrigger className="align-middle">
						<EllipsisVertical />
					</SheetTrigger>
					<SheetContent className="flex flex-col items-start p-4">
						<SheetTitle>Menu</SheetTitle>
						<ModeToggle />
						{/* Tutaj również wstawiamy przekazany prop */}
						{userButton}
						<SheetDescription></SheetDescription>
					</SheetContent>
				</Sheet>
			</nav>
		</div>
	);
};

export default Menu;
