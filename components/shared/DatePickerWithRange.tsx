"use client";

import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerWithRangeProps {
	className?: string;
	from?: Date;
	to?: Date;
	onSelect: (range: DateRange | undefined) => void;
}

export function DatePickerWithRange({
	className,
	from,
	to,
	onSelect,
}: DatePickerWithRangeProps) {
	const [date, setDate] = React.useState<DateRange | undefined>({
		from,
		to,
	});

	// EN: Sync internal state with URL parameters
	React.useEffect(() => {
		setDate({ from, to });
	}, [from, to]);

	const handleSelect = (newDate: DateRange | undefined) => {
		setDate(newDate);
		onSelect(newDate);
	};

	return (
		<div className={cn("grid gap-2", className)}>
			<Popover>
				<PopoverTrigger asChild>
					<Button
						id="date"
						variant={"outline"}
						className={cn(
							"w-fit justify-start text-left font-bold text-[11px] tracking-wider transition-all duration-300",
							"bg-slate-900/50 border-t-border-subtle hover:bg-slate-800/80 hover:text-slate-100 text-slate-400 rounded-lg h-8 px-3 ml-2 border-l border-t-border-subtle",
							!date && "text-slate-500",
						)}
					>
						<CalendarIcon className="mr-2 h-3.5 w-3.5" />
						{date?.from ? (
							date.to ? (
								<>
									{format(date.from, "dd MMM y", { locale: pl })} -{" "}
									{format(date.to, "dd MMM y", { locale: pl })}
								</>
							) : (
								format(date.from, "dd MMM y", { locale: pl })
							)
						) : (
							<span>Wybierz zakres dat OD - DO</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-auto p-0 bg-slate-950 border-slate-800 shadow-2xl"
					align="end"
				>
					{/* EN: Removed 'initialFocus' to fix TypeScript compatibility with react-day-picker v9 */}
					<Calendar
						mode="range"
						defaultMonth={date?.from}
						selected={date}
						onSelect={handleSelect}
						numberOfMonths={2}
						locale={pl}
						className="text-slate-300"
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
}
