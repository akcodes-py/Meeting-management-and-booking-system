import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  User,
  Mail,
  AtSign,
  Globe,
  Calendar,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { api, getErrorMessage } from "../services/api";
import { getUser } from "../services/auth";
import { formatDateTime } from "../utils/dates";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/ConfirmModal";

export default function Settings() {
  const user = getUser();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [cal, setCal] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  useEffect(() => {
    const calendar = searchParams.get("calendar");
    if (calendar === "connected") {
      showToast("Google Calendar connected successfully!", "success");
    } else if (calendar === "error") {
      showToast("Could not connect Google Calendar. Please try again.", "error");
    }
    if (calendar) {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast]);

  const loadStatus = () => {
    setLoading(true);
    api.calendar
      .status()
      .then((res) => setCal(res.data))
      .catch((err) => {
        const msg = getErrorMessage(err);
        setError(msg);
        showToast(msg, "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadStatus, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError("");
    try {
      const res = await api.calendar.connect();
      if (res.data && res.data.authorization_url) {
        window.location.href = res.data.authorization_url;
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Could not start Google sign-in.");
      setError(msg);
      showToast(msg, "error");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setError("");
    try {
      await api.calendar.disconnect();
      setCal({ connected: false });
      setShowDisconnectModal(false);
      showToast("Google Calendar disconnected.", "info");
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to disconnect Google Calendar."), "error");
    } finally {
      setDisconnecting(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "H";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-xl font-bold tracking-tight text-base-content">Account & Settings</h1>
        <p className="text-xs text-base-content/60 mt-0.5">
          Manage your profile details and Google Calendar integration.
        </p>
      </div>

      {error && (
        <div role="alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Host Profile Details Card */}
      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-base-200 bg-base-200/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
            {initials}
          </div>
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-base-content">
              Host Profile
            </h2>
            <p className="text-[11px] text-base-content/50">Your account identity used across public booking pages</p>
          </div>
        </div>

        <div className="p-6">
          <dl className="grid sm:grid-cols-2 gap-3.5 text-xs">
            <div className="bg-base-200/40 border border-base-200 p-3.5 rounded-xl">
              <dt className="text-base-content/50 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Full Name
              </dt>
              <dd className="text-xs font-semibold mt-1 text-base-content">
                {user?.name || "—"}
              </dd>
            </div>

            <div className="bg-base-200/40 border border-base-200 p-3.5 rounded-xl">
              <dt className="text-base-content/50 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Email Address
              </dt>
              <dd className="text-xs font-semibold mt-1 text-base-content font-mono">
                {user?.email || "—"}
              </dd>
            </div>

            <div className="bg-base-200/40 border border-base-200 p-3.5 rounded-xl">
              <dt className="text-base-content/50 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-primary" />
                Username
              </dt>
              <dd className="text-xs font-semibold mt-1 text-base-content font-mono">
                @{user?.username || "—"}
              </dd>
            </div>

            <div className="bg-base-200/40 border border-base-200 p-3.5 rounded-xl">
              <dt className="text-base-content/50 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Default Timezone
              </dt>
              <dd className="text-xs font-semibold mt-1 text-base-content font-mono">
                {user?.timezone || "UTC"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Google Calendar Integration Card */}
      <div className="bg-base-100 border border-base-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between bg-base-200/30">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-base-content">
              Google Calendar Synchronization
            </h2>
          </div>
          {cal?.connected ? (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Connected
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
              Not Connected
            </span>
          )}
        </div>

        <div className="p-6 text-xs space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : cal?.connected ? (
            <div className="space-y-4">
              <div className="bg-base-200/40 border border-base-200 p-4 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-base-content/60 font-medium">Connected Google Account:</span>
                  <span className="font-semibold font-mono text-xs text-base-content">
                    {cal.google_account_email || "Active Google Account"}
                  </span>
                </div>
                {cal.token_expiry && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-[11px] text-base-content/50 pt-1 border-t border-base-200">
                    <span>Token Expiry:</span>
                    <span>{formatDateTime(cal.token_expiry)}</span>
                  </div>
                )}
              </div>

              {cal.needs_reauth ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-amber-700 dark:text-amber-400">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Google Calendar authorization has expired. Please reconnect.</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-xs rounded-lg shrink-0"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    Reconnect Google
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-base-200">
                  <span className="text-base-content/60 leading-relaxed text-[11px]">
                    Real-time free/busy synchronization and Google Meet link generation are active.
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-xs rounded-lg shrink-0"
                    onClick={() => setShowDisconnectModal(true)}
                  >
                    Disconnect Calendar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/15 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-base-content">Why connect Google Calendar?</p>
                  <p className="text-[11px] text-base-content/70 leading-relaxed">
                    Connecting your calendar automatically reads your busy blocks to prevent double bookings, creates events on your calendar when an invitee books, and automatically creates a Google Meet link for every session.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm text-xs font-medium rounded-lg shadow-xs"
                onClick={handleConnect}
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Connecting...
                  </>
                ) : (
                  "Connect Google Calendar"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      <ConfirmModal
        isOpen={showDisconnectModal}
        title="Disconnect Google Calendar"
        message="Are you sure you want to disconnect Google Calendar? The system will no longer synchronize conflicts with your calendar or generate Google Meet links for new appointments."
        confirmLabel="Disconnect Calendar"
        confirmVariant="btn-error"
        isLoading={disconnecting}
        onConfirm={handleDisconnect}
        onCancel={() => setShowDisconnectModal(false)}
      />
    </div>
  );
}