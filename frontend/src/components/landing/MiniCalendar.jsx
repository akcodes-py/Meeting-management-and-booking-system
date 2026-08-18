import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toDateInputValue } from "../../utils/dates";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function MiniCalendar({ selectedDate, onSelectDate, markerDates = [] }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const goPrev = () => setViewMonth(new Date(year, month - 1, 1));
  const goNext = () => setViewMonth(new Date(year, month + 1, 1));

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedKey = selectedDate ? toDateInputValue(selectedDate) : null;
  const todayKey = toDateInputValue(today);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-base-content">{monthLabel}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="w-6 h-6 rounded-md flex items-center justify-center text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="w-6 h-6 rounded-md flex items-center justify-center text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w, i) => (
          <div key={`w-${i}`} className="text-center text-[10px] font-medium text-base-content/40 py-1">
            {w}
          </div>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} className="h-7" />;
          const key = toDateInputValue(date);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          const hasMeetings = markerDates.includes(key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={isSelected}
              className={`relative h-7 text-[11px] font-medium rounded-md transition-colors duration-150 cursor-pointer active:scale-95 ${
                isSelected
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/80 hover:bg-base-200"
              }`}
            >
              {date.getDate()}
              {!isSelected && isToday && (
                <span className="absolute inset-0 rounded-md ring-1 ring-inset ring-primary/50" />
              )}
              {hasMeetings && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
