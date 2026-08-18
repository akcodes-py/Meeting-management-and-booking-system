import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { isLoggedIn } from "../../services/auth";
import ThemeToggle from "../ThemeToggle";

export default function LandingNavbar() {
  const authed = isLoggedIn();

  return (
    <header className="border-b border-base-200 bg-base-100/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-sm sm:text-base text-base-content">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <span>MeetingManager</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {authed ? (
            <Link
              to="/dashboard"
              className="btn btn-primary btn-sm text-xs font-medium rounded-lg shadow-xs gap-1.5"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-base-content/80 hover:text-base-content hover:bg-base-200 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-sm text-xs font-medium rounded-lg shadow-xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
