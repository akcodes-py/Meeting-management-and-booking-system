import { Bell, CalendarCheck, CalendarDays, ListChecks } from "lucide-react";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Simple Booking",
    description: "Book meetings quickly without unnecessary steps — a few clicks and your time is confirmed.",
  },
  {
    icon: CalendarDays,
    title: "Calendar Integration",
    description: "Keep meetings synchronized with your calendar. Google Calendar busy blocks are respected automatically.",
  },
  {
    icon: ListChecks,
    title: "Meeting Management",
    description: "View, edit and manage upcoming meetings from one clean, focused dashboard.",
  },
  {
    icon: Bell,
    title: "Email Notifications",
    description: "Receive useful meeting updates, confirmations and calendar invitations in your inbox.",
  },
];

export default function FeatureSection() {
  return (
    <section className="space-y-10">
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight text-base-content">
          Everything you need to stay organized
        </h2>
        <p className="text-sm text-base-content/60 leading-relaxed">
          A focused tool for scheduling and managing meetings — built around your calendar, not against it.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="border border-base-200 bg-base-100 rounded-xl p-5 transition-colors duration-150 hover:border-primary/30 hover:shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              <f.icon className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-semibold text-sm text-base-content">{f.title}</h3>
            <p className="text-xs text-base-content/60 leading-relaxed mt-1.5">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
