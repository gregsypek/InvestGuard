"use client";

import ModeToggle from "./header/ModeToggle";

interface MenuProps {
	// Definiujemy prop jako React.ReactNode, aby mógł przyjąć dowolny komponent
	userButton?: React.ReactNode;
}
const DesktopNav = ({ userButton }: MenuProps) => {
	return (
		// 🚀 ZMIANA: Ukrywamy ten blok na mobile całkowicie, eliminując powielone ikony profilu/motywu
		<div className="hidden md:flex justify-end gap-3 items-center">
			<nav className="flex w-full max-w-xs gap-1">
				<ModeToggle />
				{userButton && userButton}
			</nav>
		</div>
	);
};

export default DesktopNav;
