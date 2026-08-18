import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import { isLoggedIn } from "../../services/auth";

export default function LandingFooter() {
  const authed = isLoggedIn();
  const bookTarget = authed ? "/dashboard" : "/register";
  const viewTarget = authed ? "/bookings" : "/login";

  return (
    <footer className="border-t border-base-200 bg-base-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-8">
          <div className="space-y-3">
            <Link to="/" className="flex items-center gap-2 font-semibold text-base-content">
              <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              MeetingManager
            </Link>
            <p className="text-xs text-base-content/60 leading-relaxed max-w-xs">
              Meeting management and booking with real-time availability and Google Calendar sync.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-base-content mb-3">Product</h4>
            <ul className="space-y-2 text-xs text-base-content/60">
              <li>
                <Link to={bookTarget} className="hover:text-base-content transition-colors">
                  Book a Meeting
                </Link>
              </li>
              <li>
                <Link to={viewTarget} className="hover:text-base-content transition-colors">
                  View Meetings
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-base-content transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-base-content mb-3">Dashboard</h4>
            <ul className="space-y-2 text-xs text-base-content/60">
              <li>
                <Link to="/dashboard" className="hover:text-base-content transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/event-types" className="hover:text-base-content transition-colors">
                  Event Types
                </Link>
              </li>
              <li>
                <Link to="/availability" className="hover:text-base-content transition-colors">
                  Availability
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-base-content/50">
            © {new Date().getFullYear()} Meeting Management & Booking System
          </span>
          <span className="text-[11px] text-base-content/40">Built with Django REST Framework & React</span>
        </div>
      </div>
    </footer>
  );
}
