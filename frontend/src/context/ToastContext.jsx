import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext({
  showToast: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastConfig = (type) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          classes: "bg-base-100 border-emerald-500/30 text-base-content shadow-lg shadow-emerald-500/5",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
          classes: "bg-base-100 border-rose-500/30 text-base-content shadow-lg shadow-rose-500/5",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          classes: "bg-base-100 border-amber-500/30 text-base-content shadow-lg shadow-amber-500/5",
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
          classes: "bg-base-100 border-blue-500/30 text-base-content shadow-lg shadow-blue-500/5",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => {
            const config = getToastConfig(t.type);
            return (
              <div
                key={t.id}
                role="alert"
                className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 ${config.classes}`}
              >
                <div className="mt-0.5">{config.icon}</div>
                <span className="flex-1 leading-snug">{t.message}</span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className="text-base-content/40 hover:text-base-content transition-colors -mr-1 -mt-1 p-1 rounded-md"
                  aria-label="Dismiss notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
