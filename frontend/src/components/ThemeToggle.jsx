import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/**
 * Exact circular Theme Toggle button.
 * - In Light mode: White circular background, subtle border & shadow, centered dark crescent Moon icon.
 * - In Dark mode: Dark circular background, subtle border & shadow, centered light Sun icon.
 * - Single click transitions between light and dark mode smoothly.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex items-center justify-center w-8.5 h-8.5 rounded-full border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 cursor-pointer select-none ${
        isDark
          ? "bg-neutral-800 border-neutral-700 text-neutral-100 shadow-xs hover:bg-neutral-700 hover:border-neutral-600"
          : "bg-white border-neutral-200 text-neutral-700 shadow-xs hover:bg-neutral-50 hover:border-neutral-300"
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-neutral-100" strokeWidth={2} />
      ) : (
        <Moon className="w-4 h-4 text-neutral-700" strokeWidth={2} />
      )}
    </button>
  );
}
