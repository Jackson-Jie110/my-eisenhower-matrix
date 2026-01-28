import React from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Calendar, ChevronDown } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "../../lib/utils";

type DatePickerProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
};

const dayPickerClassNames: NonNullable<React.ComponentProps<typeof DayPicker>["classNames"]> =
  {
    root: "p-2",
    months: "flex flex-col",
    month: "space-y-4",
    month_caption: "relative flex items-center justify-center pt-1",
    caption_label: "text-sm font-medium text-slate-200",
    nav: "absolute inset-y-0 left-0 right-0 flex items-center justify-between",
    button_previous:
      "h-8 w-8 rounded-full bg-transparent p-0 text-slate-200/70 transition-colors hover:bg-white/10 hover:text-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-30",
    button_next:
      "h-8 w-8 rounded-full bg-transparent p-0 text-slate-200/70 transition-colors hover:bg-white/10 hover:text-slate-100 aria-disabled:pointer-events-none aria-disabled:opacity-30",
    chevron: "h-4 w-4 fill-current",
    month_grid: "w-full border-collapse",
    weekdays: "",
    weekday: "w-9 pb-1 text-center text-[0.75rem] font-medium text-slate-500",
    weeks: "",
    week: "",
    day: "h-9 w-9 p-0 text-center align-middle focus-within:relative focus-within:z-20",
    day_button:
      "h-9 w-9 rounded-full bg-transparent p-0 text-sm font-normal text-slate-300 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-0 disabled:pointer-events-none disabled:text-slate-600 disabled:opacity-50",
    selected:
      "[&>button]:bg-blue-600 [&>button]:text-white [&>button]:shadow-lg [&>button]:shadow-blue-500/30 [&>button]:font-bold [&>button]:hover:bg-blue-700",
    today:
      "[&>button]:text-blue-400 [&>button]:font-semibold [&>button]:relative [&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-1/2 [&>button]:after:h-1 [&>button]:after:w-1 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-blue-400",
    outside: "[&>button]:text-slate-600 [&>button]:opacity-50",
    disabled: "[&>button]:text-slate-600 [&>button]:opacity-50",
    hidden: "invisible",
    range_middle: "[&>button]:bg-slate-800 [&>button]:text-slate-100",
    range_start: "[&>button]:bg-blue-600 [&>button]:text-white",
    range_end: "[&>button]:bg-blue-600 [&>button]:text-white",
    focused: "[&>button]:ring-2 [&>button]:ring-neon-blue/40",
  };

export function DatePicker({
  value,
  onChange,
  placeholder = "选择日期",
  disabled,
  className,
  buttonClassName,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const root = containerRef.current;
      if (!root) {
        return;
      }
      if (!(event.target instanceof Node)) {
        return;
      }
      if (root.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const label = value ? format(value, "yyyy-MM-dd") : placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 px-5 text-base font-semibold text-slate-200 backdrop-blur-md transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-blue focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName
        )}
      >
        <Calendar className="h-4 w-4 opacity-70" />
        <span className="min-w-0 truncate">{label}</span>
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 shrink-0 opacity-70 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="选择日期"
          className="absolute left-0 top-full z-50 mt-2 rounded-xl bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl border border-white/10"
        >
          <DayPicker
            mode="single"
            required
            locale={zhCN}
            weekStartsOn={1}
            showOutsideDays
            defaultMonth={value ?? new Date()}
            selected={value}
            onSelect={(next) => {
              if (!next) {
                return;
              }
              onChange(next);
              setIsOpen(false);
            }}
            classNames={dayPickerClassNames}
          />
        </div>
      ) : null}
    </div>
  );
}
