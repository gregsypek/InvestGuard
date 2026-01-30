import Menu from "./shared/Menu";

const Header = () => {
	return (
		<header className="p-2  border-border  bg-background text-foreground border-b ">
			<div className="px-5  ">
				<Menu />
			</div>
		</header>
	);
};

export default Header;
