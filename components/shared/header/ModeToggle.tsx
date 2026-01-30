"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";

const ModeToggle = () => {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		const t = setTimeout(() => setMounted(true), 0);
		return () => clearTimeout(t);
	}, []);

	if (!mounted) {
		return null;
	}

	return (
		<Button
			variant="ghost"
			className="focus-visible:ring-0 focus-visible:ring-offset-0"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
		>
			{theme === "dark" ? <MoonIcon /> : <SunIcon />}
		</Button>
	);
};

export default ModeToggle;
