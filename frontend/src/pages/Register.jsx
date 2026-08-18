import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Lock, Mail, User, Globe, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { saveSession } from "../services/auth";
import { useToast } from "../context/ToastContext";
import ThemeToggle from "../components/ThemeToggle";

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Dubai",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Australia/Sydney",
];

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    timezone: "UTC",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await api.signup(form);
      saveSession(res.data);
      showToast("Account created successfully!", "success");
      navigate("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err, "Registration failed. Please check your inputs.");
      setError(msg);
      showToast(msg, "error");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-base-100 py-12 relative transition-colors duration-150">
      {/* Top corner theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-lg text-base-content">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <span>MeetingManager</span>
          </Link>
          <p className="text-xs text-base-content/60 mt-1">Create your host account</p>
        </div>

        {/* Register Box */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-7 shadow-lg space-y-5">
          <div className="border-b border-base-200 pb-3">
            <h1 className="text-base font-bold text-base-content tracking-tight">Create Host Account</h1>
            <p className="text-xs text-base-content/60 mt-0.5">Start sharing public booking links</p>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-base-content">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="input input-bordered input-sm w-full pl-9 text-xs rounded-lg"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-base-content">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="email"
                  placeholder="jane@example.com"
                  className="input input-bordered input-sm w-full pl-9 text-xs rounded-lg"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-base-content">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="input input-bordered input-sm w-full pl-9 pr-9 text-xs rounded-lg"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-base-content">Default Timezone</label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <select
                  className="select select-bordered select-sm w-full pl-9 text-xs rounded-lg"
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm w-full text-xs font-medium rounded-lg shadow-xs mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="text-center text-xs text-base-content/60 pt-3 border-t border-base-200">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}