import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Video } from "lucide-react";
import { isLoggedIn } from "../../services/auth";
import { toDateInputValue } from "../../utils/dates";
import MiniCalendar from "./MiniCalendar";

function buildDemoMeetings() {
  const today = new Date();
  const dayAfter = (days) => {
    const d = new Date(today);
    d.setDate(today.getDate() + days);
    return d;
  };

  return {
    [toDateInputValue(today)]: [
      { time: "10:00", title: "Team Meeting", status: "CONFIRMED", people: ["AS", "MK", "JL"] },
      { time: "13:30", title: "Client Call", status: "PENDING", people: ["RW"] },
      { time: "16:00", title: "Project Review", status: "CONFIRMED", people: ["AS", "TP"] },
    ],
    [toDateInputValue(dayAfter(1))]: [
      { time: "09:30", title: "Design Sync", status: "CONFIRMED", people: ["MK", "JL"] },
      { time: "15:00", title: "Vendor Demo", status: "PENDING", people: ["RW", "TP"] },
    ],
    [toDateInputValue(dayAfter(3))]: [
      { time: "11:00", title: "Weekly Planning", status: "CONFIRMED", people: ["AS", "MK", "RW", "JL"] },
      { time: "17:30", title: "1:1 with Manager", status: "PENDING", people: ["TP"] },
    ],
  };
}

const STATUS_STYLES = {
  CONFIRMED: "bg-primary/10 text-primary",
  PENDING: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
];

export default function ProductPreview() {
  const demoMeetings = useMemo(buildDemoMeetings, []);
  const markerDates = useMemo(() => Object.keys(demoMeetings), [demoMeetings]);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const meetings = demoMeetings[toDateInputValue(selectedDate)] || [];

  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const authed = isLoggedIn();
  const bookTarget = authed ? "/dashboard" : "/register";

  return (
    <div className="bg-base-100 border border-base-200 rounded-2xl shadow-xl shadow-base-300/20 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <span className="text-[11px] font-medium text-base-content/50 truncate">
          MeetingManager · Dashboard
        </span>
      </div>

      <div className="p-5 space-y-5">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          markerDates={markerDates}
        />

        {/* Meetings list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-base-content">{selectedLabel}</span>
            <span className="text-[10px] text-base-content/40">
              {meetings.length} meeting{meetings.length === 1 ? "" : "s"}
            </span>
          </div>

          {meetings.length === 0 ? (
            <div className="border border-dashed border-base-300 rounded-lg py-6 text-center text-[11px] text-base-content/50">
              No meetings scheduled for this day.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {meetings.map((m, i) => (
                <li
                  key={`${m.time}-${i}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-base-200 hover:border-primary/30 hover:bg-base-200/50 transition-colors duration-150"
                >
                  <span className="text-xs font-semibold text-base-content tabular-nums w-11 shrink-0">
                    {m.time}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-base-content truncate">
                      {m.title}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-base-content/50 mt-0.5">
                      <Video className="w-3 h-3" />
                      Google Meet
                    </span>
                  </span>
                  <span className="hidden sm:flex items-center -space-x-1.5 shrink-0">
                    {m.people.slice(0, 3).map((p, j) => (
                      <span
                        key={p}
                        className={`w-5 h-5 rounded-full border-2 border-base-100 text-[8px] font-semibold flex items-center justify-center ${
                          AVATAR_COLORS[j % AVATAR_COLORS.length]
                        }`}
                      >
                        {p}
                      </span>
                    ))}
                  </span>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      STATUS_STYLES[m.status] || "bg-base-200 text-base-content/60"
                    }`}
                  >
                    {m.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Booking action */}
        <Link
          to={bookTarget}
          className="btn btn-primary btn-sm w-full rounded-lg text-xs font-medium shadow-xs"
        >
          <CalendarCheck className="w-4 h-4" />
          Book Meeting
        </Link>
      </div>
    </div>
  );
}
