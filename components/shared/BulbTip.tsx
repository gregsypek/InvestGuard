import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { useState } from "react";

const BulbTip = ({ title, content }: { title: string; content: string }) => {
	const [showTip, setShowTip] = useState(false); // EN: State to toggle visibility

	return (
		<div className="rounded-xl overflow-hidden transition-all duration-300">
			<button
				onClick={() => setShowTip(!showTip)}
				className="w-full p-4 flex items-center justify-between transition-colors cursor-pointer group"
			>
				<div className="flex items-center gap-2 font-bold text-lg">
					{/* EN: Wrapper for the icon to handle the glow effect consistently */}
					{/* UI: Kontener dla ikony, aby obsłużyć efekt poświaty */}
					<div className="relative flex items-center justify-center">
						{/* EN: The glow effect (hidden by default, appears on group-hover) */}
						{/* UI: Efekt poświaty (ukryty, pojawia się po najechaniu na grupę) */}
						<div
							className={cn(
								"absolute inset-0 bg-yellow-400 blur-md opacity-0",
								showTip && "opacity-50 transition-opacity",
							)}
						/>

						<Lightbulb
							className={cn(
								"relative h-6 w-6  transition-all duration-300",
								showTip ? "text-yellow-400" : "text-yellow-600",
							)}
							aria-expanded={showTip}
						/>
					</div>

					<span className="transition-colors duration-300 ">{title}</span>
				</div>

				<div className="text-muted-foreground  transition-colors">
					{showTip ? (
						<ChevronUp className="h-5 w-5" />
					) : (
						<ChevronDown className="h-5 w-5" />
					)}
				</div>
			</button>

			{/* EN: Animating the visibility of the content */}
			{/* UI: Animacja widoczności treści */}
			<div
				className={cn(
					"px-6 overflow-hidden transition-all duration-300 ease-in-out",
					showTip ? "max-h-40 pb-6 opacity-100" : "max-h-0 opacity-0",
				)}
			>
				<p className="text-muted-foreground text-sm border-t border-bond-blue-border pt-4">
					{content}
				</p>
			</div>
		</div>
	);
};

export default BulbTip;
