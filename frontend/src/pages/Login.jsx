import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { saveSession } from "../services/auth";
import { useToast } from "../context/ToastContext";
import ThemeToggle from "../components/ThemeToggle";

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await api.login(form);
      saveSession(res.data);
      showToast("Logged in successfully.", "success");
      navigate("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err, "Invalid email or password.");
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
          <p className="text-xs text-base-content/60 mt-1">Sign in to your host scheduling dashboard</p>
        </div>

        {/* Login Form Box */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-7 shadow-lg space-y-5">
          <div className="border-b border-base-200 pb-3">
            <h1 className="text-base font-bold text-base-content tracking-tight">Sign In</h1>
            <p className="text-xs text-base-content/60 mt-0.5">Enter your host credentials</p>
          </div>

          {error && (
            <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-base-content">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="email"
                  placeholder="host@example.com"
                  className="input input-bordered input-sm w-full pl-9 text-xs rounded-lg"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
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

            <button
              type="submit"
              className="btn btn-primary btn-sm w-full text-xs font-medium rounded-lg shadow-xs mt-2"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="text-center text-xs text-base-content/60 pt-3 border-t border-base-200">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}