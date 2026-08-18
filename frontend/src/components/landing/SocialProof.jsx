export default function SocialProof() {
  const points = [
    "No double bookings",
    "Google Meet auto-generated",
    "Shareable booking links",
  ];

  return (
    <section className="text-center space-y-3 pt-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-base-content/40">
        Designed for teams that want meetings to stay organized
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        {points.map((p, i) => (
          <span
            key={p}
            className="inline-flex items-center gap-2 text-xs text-base-content/60"
          >
            {i > 0 && <span className="hidden sm:inline w-1 h-1 rounded-full bg-base-content/30" />}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {p}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
