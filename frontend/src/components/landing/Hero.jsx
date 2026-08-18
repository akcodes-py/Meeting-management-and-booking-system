import { Link } from "react-router-dom";
import { ArrowRight, CalendarPlus, CalendarDays } from "lucide-react";
import { isLoggedIn } from "../../services/auth";
import ProductPreview from "./ProductPreview";

export default function Hero() {
  const authed = isLoggedIn();
  const bookTarget = authed ? "/dashboard" : "/register";
  const viewTarget = authed ? "/bookings" : "/login";

  return (
    <div className="grid lg:grid-cols-2 gap-12 lg:gap-10 items-center">
      {/* Copy */}
      <div className="space-y-6 text-center lg:text-left">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-base-200 bg-base-100 text-[11px] font-medium text-base-content/70">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Meeting scheduling for modern teams
        </span>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-content leading-[1.15]">
          Manage meetings without the hassle
        </h1>

        <p className="text-sm sm:text-base text-base-content/65 leading-relaxed max-w-xl mx-auto lg:mx-0">
          Share your personalized booking link, let guests pick from real-time available slots,
          and get automatic Google Meet invites — no more back-and-forth emails.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
          <Link
            to={bookTarget}
            className="btn btn-primary btn-md w-full sm:w-auto rounded-lg px-6 shadow-xs gap-2"
          >
            <CalendarPlus className="w-4 h-4" />
            Book a Meeting
          </Link>
          <Link
            to={viewTarget}
            className="btn btn-outline btn-md w-full sm:w-auto rounded-lg px-6 gap-2"
          >
            View Meetings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 text-[11px] text-base-content/50">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Google Calendar sync
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-base-content/30" />
            Real-time availability
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-base-content/30" />
            Automatic Meet invites
          </span>
        </p>
      </div>

      {/* Product preview */}
      <div className="animate-fade-up [animation-delay:120ms]">
        <ProductPreview />
      </div>
    </div>
  );
}
